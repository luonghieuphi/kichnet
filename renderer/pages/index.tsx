"use client";
import { useState, useEffect } from "react";
import { ELECTRON_COMMANDS } from "@common/electron-commands";
import { useAtomValue, useSetAtom } from "jotai";
import { customModelIdsAtom } from "../atoms/models-list-atom";
import {
  batchModeAtom,
  savedOutputPathAtom,
  progressAtom,
  rememberOutputFolderAtom,
  userStatsAtom,
} from "../atoms/user-settings-atom";
import useLogger from "../components/hooks/use-logger";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { translationAtom } from "@/atoms/translations-atom";
import { Sparkles } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MainContent from "@/components/main-content";
import getDirectoryFromPath from "@common/get-directory-from-path";
import { FEATURE_FLAGS } from "@common/feature-flags";
import { ImageFormat, VALID_IMAGE_FORMATS } from "@/lib/valid-formats";
import { initCustomModels } from "@/components/hooks/use-custom-models";
import { OnboardingDialog } from "@/components/main-content/onboarding-dialog";
import useSystemInfo from "@/components/hooks/use-system-info";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const SECRET_SALT = "SHARPIX_SECURE_ACTIVATION_SALT_2026_PRO_KEY";

function generateHash(input: string): string {
  let hash = 0;
  const salted = input + SECRET_SALT;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function getMachineHash(machineId: string): string {
  let hash = 0;
  const salted = machineId + "SHARPIX_HWID_SALT_2026";
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function verifyKeyForMachine(key: string, currentMachineHash: string): { 
  valid: boolean; 
  errorType?: "format" | "different_machine" | "invalid_signature" | "expired" | "clock_tampered" 
} {
  if (!key) return { valid: false, errorType: "format" };
  const cleanKey = key.trim().toUpperCase();
  const parts = cleanKey.split("-");
  
  const isPrefixValid = parts[0] === "SHARPIX" || parts[0] === "PIXELUP" || parts[0] === "PIXEL_UP" || parts[0] === "PIXEL";

  // 1. Support legacy 3-part keys as permanent lifetime keys
  // HWID Lock: SHARPIX-[MACHINE_HASH]-[SIGNATURE] (3 parts)
  if (parts.length === 3) {
    if (!isPrefixValid) return { valid: false, errorType: "format" };
    const keyPart1 = parts[1];
    const keySignature = parts[2];
    if (!/^[A-Z0-9]{6}$/.test(keyPart1)) return { valid: false, errorType: "format" };
    
    if (keyPart1 !== currentMachineHash) return { valid: false, errorType: "different_machine" };
    const expectedSignature = generateHash(keyPart1);
    if (expectedSignature === keySignature) return { valid: true };
    return { valid: false, errorType: "invalid_signature" };
  }
  
  // 2. Support new keys with Expiration:
  // HWID Lock: SHARPIX-[MACHINE_HASH]-[EXPIRY]-[SIGNATURE] (4 parts)
  // GEN Lock: SHARPIX-GEN-[RANDOM]-[EXPIRY]-[SIGNATURE] (5 parts)
  let isGeneral = false;
  let part1 = "";
  let expiryStr = "";
  let signature = "";
  
  if (parts.length === 5 && isPrefixValid && parts[1] === "GEN") {
    isGeneral = true;
    part1 = parts[2];
    expiryStr = parts[3];
    signature = parts[4];
  } else if (parts.length === 4 && isPrefixValid) {
    part1 = parts[1];
    expiryStr = parts[2];
    signature = parts[3];
  } else {
    return { valid: false, errorType: "format" };
  }
  
  // Validate format
  if (!/^[A-Z0-9]{6}$/.test(part1)) return { valid: false, errorType: "format" };
  if (expiryStr !== "PERM" && !/^(?:\d{6}|\d{8}|\d{10})$/.test(expiryStr)) return { valid: false, errorType: "format" };
  
  // Verify Signature
  if (isGeneral) {
    const expectedSignature = generateHash(part1 + "-" + expiryStr + "_GENERAL_KEY_VALIDATION");
    if (expectedSignature !== signature) return { valid: false, errorType: "invalid_signature" };
  } else {
    if (part1 !== currentMachineHash) return { valid: false, errorType: "different_machine" };
    const expectedSignature = generateHash(part1 + "-" + expiryStr);
    if (expectedSignature !== signature) return { valid: false, errorType: "invalid_signature" };
  }
  
  // Expiry check
  if (expiryStr !== "PERM") {
    let yy = 0, mm = 0, dd = 0, hh = 23, min = 59;
    
    if (expiryStr.length === 10) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
      hh = parseInt(expiryStr.slice(6, 8));
      min = parseInt(expiryStr.slice(8, 10));
    } else if (expiryStr.length === 8) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
      hh = parseInt(expiryStr.slice(6, 8));
    } else if (expiryStr.length === 6) {
      yy = parseInt(expiryStr.slice(0, 2));
      mm = parseInt(expiryStr.slice(2, 4));
      dd = parseInt(expiryStr.slice(4, 6));
    } else {
      return { valid: false, errorType: "format" };
    }
    
    // Validate date parts
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh < 0 || hh > 23 || min < 0 || min > 59) {
      return { valid: false, errorType: "format" };
    }
    
    const expiryDate = new Date(2000 + yy, mm - 1, dd, hh, min, 59);
    const now = new Date();
    
    if (now > expiryDate) {
      return { valid: false, errorType: "expired" };
    }
    
    // Anti-clock tampered logic
    try {
      const lastRunStr = localStorage.getItem("pixelup_last_run_time") || localStorage.getItem("sharpix_last_run_time");
      if (lastRunStr) {
        const lastRun = parseInt(lastRunStr);
        if (now.getTime() < lastRun - 5 * 60 * 1000) { // 5 minutes grace
          return { valid: false, errorType: "clock_tampered" };
        }
      }
      localStorage.setItem("pixelup_last_run_time", now.getTime().toString());
    } catch (e) {
      // localStorage disabled or full
    }
  }
  
  return { valid: true };
}

async function isKeyRevoked(key: string, machineHash: string): Promise<boolean> {
  try {
    // Check if key is blacklisted
    const keyRef = doc(db, "revoked_keys", key.trim().toUpperCase());
    const keySnap = await getDoc(keyRef);
    if (keySnap.exists()) return true;

    // Check if machine is blacklisted
    const machineRef = doc(db, "revoked_machines", machineHash);
    const machineSnap = await getDoc(machineRef);
    if (machineSnap.exists()) return true;

    return false;
  } catch (e) {
    console.error("Blacklist check failed:", e);
    return false; // Fail open if network error
  }
}

const Home = () => {
  const t = useAtomValue(translationAtom);
  const logit = useLogger();
  const { toast } = useToast();
  const { systemInfo } = useSystemInfo();

  initCustomModels();

  const [isLoading, setIsLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState("");
  const [activationError, setActivationError] = useState("");
  const [machineHash, setMachineHash] = useState("");
  const [machineIdFull, setMachineIdFull] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [upscaledImagePath, setUpscaledImagePath] = useState("");
  const [dimensions, setDimensions] = useState({
    width: null,
    height: null,
  });
  const setOutputPath = useSetAtom(savedOutputPathAtom);
  const rememberOutputFolder = useAtomValue(rememberOutputFolderAtom);
  const batchMode = useAtomValue(batchModeAtom);
  const [batchFolderPath, setBatchFolderPath] = useState("");
  const [upscaledBatchFolderPath, setUpscaledBatchFolderPath] = useState("");
  const setProgress = useSetAtom(progressAtom);
  const [doubleUpscaylCounter, setDoubleUpscaylCounter] = useState(0);
  const setModelIds = useSetAtom(customModelIdsAtom);
  const setUserStats = useSetAtom(userStatsAtom);

  const selectImageHandler = async () => {
    resetImagePaths();
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FILE);
    if (path === null) return;
    logit("🖼 Selected Image Path: ", path);
    setImagePath(path);
    const dirname = getDirectoryFromPath(path);
    logit("📁 Selected Image Directory: ", dirname);
    if (!FEATURE_FLAGS.APP_STORE_BUILD) {
      if (!rememberOutputFolder) {
        setOutputPath(dirname);
      }
    }
    validateImagePath(path);
  };

  const selectFolderHandler = async () => {
    resetImagePaths();
    const path = await window.electron.invoke(ELECTRON_COMMANDS.SELECT_FOLDER);
    if (path !== null) {
      logit("🖼 Selected Folder Path: ", path);
      setBatchFolderPath(path);
      if (!rememberOutputFolder) {
        setOutputPath(path);
      }
    } else {
      logit("🚫 Folder selection cancelled");
      setBatchFolderPath("");
      if (!rememberOutputFolder) {
        setOutputPath("");
      }
    }
  };

  const validateImagePath = (path: string) => {
    if (path.length > 0) {
      logit("🖼 imagePath: ", path);
      const extension = path.split(".").pop().toLowerCase() as ImageFormat;
      logit("🔤 Extension: ", extension);
      if (!VALID_IMAGE_FORMATS.includes(extension)) {
        toast({
          title: t("ERRORS.INVALID_IMAGE_ERROR.TITLE"),
          description: t("ERRORS.INVALID_IMAGE_ERROR.DESCRIPTION"),
        });
        resetImagePaths();
      }
    } else {
      resetImagePaths();
    }
  };

  // ELECTRON EVENT LISTENERS
  useEffect(() => {
    const handleErrors = (data: string) => {
      if (data.includes("Invalid GPU")) {
        toast({
          title: t("ERRORS.GPU_ERROR.TITLE"),
          description: t("ERRORS.GPU_ERROR.DESCRIPTION", { data }),
          action: (
            <div className="flex flex-col gap-2">
              <ToastAction
                altText={t("ERRORS.COPY_ERROR.TITLE")}
                onClick={() => {
                  navigator.clipboard.writeText(data);
                }}
              >
                {t("ERRORS.COPY_ERROR.TITLE")}
              </ToastAction>
              <a href="https://docs.upscayl.org/" target="_blank">
                <ToastAction altText={t("ERRORS.OPEN_DOCS_TITLE")}>
                  {t("ERRORS.OPEN_DOCS_BUTTON_TITLE")}
                </ToastAction>
              </a>
            </div>
          ),
        });
        resetImagePaths();
      } else if (data.includes("write") || data.includes("read")) {
        if (batchMode) return;
        toast({
          title: t("ERRORS.READ_WRITE_ERROR.TITLE"),
          description: t("ERRORS.READ_WRITE_ERROR.DESCRIPTION", { data }),
          action: (
            <div className="flex flex-col gap-2">
              <ToastAction
                altText="Copy Error"
                onClick={() => {
                  navigator.clipboard.writeText(data);
                }}
              >
                {t("ERRORS.COPY_ERROR.TITLE")}
              </ToastAction>
              <a href="https://docs.upscayl.org/" target="_blank">
                <ToastAction altText={t("ERRORS.OPEN_DOCS_TITLE")}>
                  {t("ERRORS.OPEN_DOCS_BUTTON_TITLE")}
                </ToastAction>
              </a>
            </div>
          ),
        });
        resetImagePaths();
      } else if (data.includes("tile size")) {
        toast({
          title: t("ERRORS.TILE_SIZE_ERROR.TITLE"),
          description: t("ERRORS.TILE_SIZE_ERROR.DESCRIPTION", { data }),
        });
        resetImagePaths();
      } else if (data.includes("uncaughtException")) {
        toast({
          title: t("ERRORS.EXCEPTION_ERROR.TITLE"),
          description: t("ERRORS.EXCEPTION_ERROR.DESCRIPTION"),
        });
        resetImagePaths();
      }
    };
    // LOG
    window.electron.on(ELECTRON_COMMANDS.LOG, (_, data: string) => {
      logit(`🎒 BACKEND REPORTED: `, data);
    });
    // SCALING AND CONVERTING
    window.electron.on(
      ELECTRON_COMMANDS.SCALING_AND_CONVERTING,
      (_, data: string) => {
        setProgress(t("APP.PROGRESS.PROCESSING_TITLE"));
      },
    );
    // UPSCAYL WARNING
    window.electron.on(ELECTRON_COMMANDS.UPSCAYL_WARNING, (_, data: string) => {
      toast({
        title: t("WARNING.GENERIC_WARNING.TITLE"),
        description: data,
      });
    });
    // METADATA ERROR
    window.electron.on(ELECTRON_COMMANDS.METADATA_ERROR, (_, data: string) => {
      toast({
        title: t("ERRORS.METADATA_ERROR.TITLE"),
        description: data,
      });
    });
    // UPSCAYL ERROR
    window.electron.on(ELECTRON_COMMANDS.UPSCAYL_ERROR, (_, data: string) => {
      toast({
        title: t("ERRORS.GENERIC_ERROR.TITLE"),
        description: data,
      });
      resetImagePaths();
    });
    // UPSCAYL PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.UPSCAYL_PROGRESS,
      (_, data: string) => {
        if (data.length > 0 && data.length < 10) {
          setProgress(data);
        } else if (data.includes("converting")) {
          setProgress(t("APP.PROGRESS.SCALING_CONVERTING_TITLE"));
        } else if (data.includes("Successful")) {
          setProgress(t("APP.PROGRESS.SUCCESS_TITLE"));
        }
        handleErrors(data);
        logit(`🚧 UPSCAYL_PROGRESS: `, data);
      },
    );
    // FOLDER UPSCAYL PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.FOLDER_UPSCAYL_PROGRESS,
      (_, data: string) => {
        if (data.includes("Successful")) {
          setProgress(t("APP.PROGRESS.SUCCESS_TITLE"));
        }
        if (data.length > 0 && data.length < 10) {
          setProgress(data);
        }
        handleErrors(data);
        logit(`🚧 FOLDER_UPSCAYL_PROGRESS: `, data);
      },
    );
    // DOUBLE UPSCAYL PROGRESS
    window.electron.on(
      ELECTRON_COMMANDS.DOUBLE_UPSCAYL_PROGRESS,
      (_, data: string) => {
        if (data.length > 0 && data.length < 10) {
          if (data === "0.00%") {
            setDoubleUpscaylCounter(doubleUpscaylCounter + 1);
          }
          setProgress(data);
        }
        handleErrors(data);
        logit(`🚧 DOUBLE_UPSCAYL_PROGRESS: `, data);
      },
    );
    // UPSCAYL DONE
    window.electron.on(ELECTRON_COMMANDS.UPSCAYL_DONE, (_, data: string) => {
      setProgress("");
      setUpscaledImagePath(data);
      setUserStats((prev) => ({
        ...prev,
        lastUpscaylDuration: new Date().getTime() - prev.lastUsedAt,
        averageUpscaylTime:
          (prev.averageUpscaylTime * prev.totalUpscayls +
            (new Date().getTime() - prev.lastUsedAt)) /
          (prev.totalUpscayls + 1),
      }));
      logit("upscaledImagePath: ", data);
      logit(`💯 UPSCAYL_DONE: `, data);
    });
    // FOLDER UPSCAYL DONE
    window.electron.on(
      ELECTRON_COMMANDS.FOLDER_UPSCAYL_DONE,
      (_, data: string) => {
        setProgress("");
        setUpscaledBatchFolderPath(data);
        logit(`💯 FOLDER_UPSCAYL_DONE: `, data);
        setUserStats((prev) => ({
          ...prev,
          lastUpscaylDuration: new Date().getTime() - prev.lastUsedAt,
          averageUpscaylTime:
            (prev.averageUpscaylTime * prev.totalUpscayls +
              (new Date().getTime() - prev.lastUsedAt)) /
            (prev.totalUpscayls + 1),
        }));
      },
    );
    // DOUBLE UPSCAYL DONE
    window.electron.on(
      ELECTRON_COMMANDS.DOUBLE_UPSCAYL_DONE,
      (_, data: string) => {
        setProgress("");
        setTimeout(() => setUpscaledImagePath(data), 500);
        setDoubleUpscaylCounter(0);
        logit(`💯 DOUBLE_UPSCAYL_DONE: `, data);
        setUserStats((prev) => ({
          ...prev,
          lastUpscaylDuration: new Date().getTime() - prev.lastUsedAt,
          averageUpscaylTime:
            (prev.averageUpscaylTime * prev.totalUpscayls +
              (new Date().getTime() - prev.lastUsedAt)) /
            (prev.totalUpscayls + 1),
        }));
      },
    );
    // CUSTOM FOLDER LISTENER
    window.electron.on(
      ELECTRON_COMMANDS.CUSTOM_MODEL_FILES_LIST,
      (_, data: string[]) => {
        logit(`📜 CUSTOM_MODEL_FILES_LIST: `, data);
        console.log("🚀 => data:", data);
        setModelIds(data);
      },
    );
  }, []);

  // LOADING STATE & ACTIVATION CHECK WITH HWID LATCH
  useEffect(() => {
    let currentHash = "";
    try {
      const nativeId = window.electron.getMachineId();
      setMachineIdFull(nativeId);
      currentHash = getMachineHash(nativeId);
      setMachineHash(currentHash);
    } catch (e) {
      console.error("Failed to load machine ID:", e);
    }

    let activated = localStorage.getItem("pixelup_activated") === "true";
    let storedKey = localStorage.getItem("pixelup_license_key") || "";
    
    // Migrate legacy storage keys
    if (!activated) {
      const legacyActivated = localStorage.getItem("sharpix_activated") === "true";
      const legacyKey = localStorage.getItem("sharpix_license_key") || "";
      if (legacyActivated && legacyKey) {
        activated = true;
        storedKey = legacyKey;
        localStorage.setItem("pixelup_activated", "true");
        localStorage.setItem("pixelup_license_key", legacyKey);
      }
    }
    
    if (activated && storedKey && currentHash) {
      const verification = verifyKeyForMachine(storedKey, currentHash);
      if (verification.valid) {
        // Initial online check
        isKeyRevoked(storedKey, currentHash).then((revoked) => {
          if (revoked) {
            localStorage.removeItem("pixelup_activated");
            localStorage.removeItem("pixelup_license_key");
            setIsActivated(false);
          } else {
            setIsActivated(true);
          }
        });
      } else {
        localStorage.removeItem("pixelup_activated");
        localStorage.removeItem("pixelup_license_key");
        setIsActivated(false);
      }
    } else {
      setIsActivated(false);
    }

    setIsLoading(false);
  }, []);

  // Real-time background activation/expiration & blacklist check
  useEffect(() => {
    if (!isActivated) return;

    let currentHash = machineHash;
    const storedKey = (localStorage.getItem("pixelup_license_key") || "").trim().toUpperCase();
    
    if (!currentHash || !storedKey) return;

    // 1. Local Offline Expiry Check (Every 15s)
    const localInterval = setInterval(() => {
      const verification = verifyKeyForMachine(storedKey, currentHash);
      if (!verification.valid) {
        localStorage.removeItem("pixelup_activated");
        localStorage.removeItem("pixelup_license_key");
        setIsActivated(false);
        toast({
          title: t("APP.ACTIVATION.TITLE"),
          description: t("APP.ACTIVATION.ERROR_EXPIRED"),
          variant: "destructive",
        });
      }
    }, 15000);

    // 2. Real-time Online Blacklist Check (Instant!)
    const keyRef = doc(db, "revoked_keys", storedKey);
    const machineRef = doc(db, "revoked_machines", currentHash);

    const handleRevoke = () => {
      localStorage.removeItem("pixelup_activated");
      localStorage.removeItem("pixelup_license_key");
      setIsActivated(false);
      toast({
        title: t("APP.ACTIVATION.TITLE"),
        description: "Key của bạn đã bị vô hiệu hóa!",
        variant: "destructive",
      });
    };

    const unsubKey = onSnapshot(keyRef, (snapshot) => {
      if (snapshot.exists()) handleRevoke();
    });

    const unsubMachine = onSnapshot(machineRef, (snapshot) => {
      if (snapshot.exists()) handleRevoke();
    });

    return () => {
      clearInterval(localInterval);
      unsubKey();
      unsubMachine();
    };
  }, [isActivated, machineHash, t, toast]);

  const handleActivate = async () => {
    const verification = verifyKeyForMachine(activationKey, machineHash);
    if (verification.valid) {
      // Check online before allowing activation
      const revoked = await isKeyRevoked(activationKey, machineHash);
      if (revoked) {
        setActivationError("Key này đã bị vô hiệu hóa trên hệ thống!");
        return;
      }

      localStorage.setItem("pixelup_activated", "true");
      localStorage.setItem("pixelup_license_key", activationKey.trim().toUpperCase());
      setIsActivated(true);
      setActivationError("");
      toast({
        title: t("APP.ACTIVATION.TITLE"),
        description: t("APP.ACTIVATION.SUCCESS"),
      });
    } else {
      let errMsg = t("APP.ACTIVATION.ERROR");
      if (verification.errorType === "different_machine") {
        errMsg = t("APP.ACTIVATION.ERROR_DIFFERENT_MACHINE");
      } else if (verification.errorType === "expired") {
        errMsg = t("APP.ACTIVATION.ERROR_EXPIRED");
      } else if (verification.errorType === "clock_tampered") {
        errMsg = t("APP.ACTIVATION.ERROR_CLOCK_TAMPERED");
      }
      setActivationError(errMsg);
      toast({
        title: t("APP.ACTIVATION.TITLE"),
        description: errMsg,
        variant: "destructive",
      });
    }
  };

  // SYSTEM INFO
  useEffect(() => {
    if (systemInfo) logit("💻 System Info:", JSON.stringify(systemInfo));
  }, [systemInfo]);

  // HANDLERS
  const resetImagePaths = () => {
    logit("🔄 Resetting image paths");
    setDimensions({
      width: null,
      height: null,
    });
    setProgress("");
    setImagePath("");
    setUpscaledImagePath("");
    setBatchFolderPath("");
    setUpscaledBatchFolderPath("");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-300">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#00c6ff] to-[#0072ff] flex items-center justify-center relative overflow-hidden shadow-2xl shadow-secondary/20 animate-pulse">
          {/* Lớp texture tạo họa tiết khối */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
          {/* Icon lấp lánh */}
          <Sparkles className="text-white w-16 h-16 relative z-10" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  if (!isActivated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-base-300 select-none relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-neutral/10 bg-base-100/30 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00c6ff] to-[#0072ff] flex items-center justify-center relative overflow-hidden shadow-xl shadow-secondary/15 animate-pulse">
              {/* Lớp texture tạo họa tiết khối */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
              {/* Icon lấp lánh */}
              <Sparkles className="text-white w-10 h-10 relative z-10" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("APP.ACTIVATION.TITLE")}
            </h1>
            <p className="text-center text-xs font-medium text-neutral-content/60 px-4 leading-relaxed mt-1">
              {t("APP.ACTIVATION.DESCRIPTION")}
            </p>
          </div>

          <div className="w-full flex flex-col gap-4">
            {/* HWID Hardware ID Label and Copy box */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-base-200/40 border border-neutral/5">
              <span className="text-[10px] font-bold text-neutral-content/40 uppercase tracking-wider">
                {t("APP.ACTIVATION.MACHINE_ID_LABEL")}
              </span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="font-mono text-sm font-extrabold text-neutral-content/90 tracking-wide">
                  PIXELUP-HWID-{machineHash}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`PIXELUP-HWID-${machineHash}`);
                    toast({
                      title: t("APP.ACTIVATION.TITLE"),
                      description: "Đã sao chép Mã máy của bạn!",
                    });
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 cursor-pointer active:scale-95"
                >
                  Sao chép
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder={t("APP.ACTIVATION.INPUT_PLACEHOLDER")}
                className={`w-full px-4 py-3 rounded-xl bg-base-200/50 border ${
                  activationError ? "border-error" : "border-neutral/20 focus:border-primary"
                } text-center font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal outline-none transition-all duration-300 focus:shadow-md focus:shadow-primary/10`}
              />
              {activationError && (
                <p className="text-xs font-semibold text-error text-center mt-1">
                  {activationError}
                </p>
              )}
            </div>

            <button
              onClick={handleActivate}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-98"
            >
              {t("APP.ACTIVATION.BUTTON_TITLE")}
              <span className="inline-block transition-transform duration-300 rotate-45 group-hover:rotate-0">🚀</span>
            </button>

            {/* SUPPORT_LINK REMOVED */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-row overflow-hidden bg-base-300"
      onPaste={(e) => console.log(e)}
    >
      <Sidebar
        imagePath={imagePath}
        dimensions={dimensions}
        setUpscaledImagePath={setUpscaledImagePath}
        batchFolderPath={batchFolderPath}
        setUpscaledBatchFolderPath={setUpscaledBatchFolderPath}
        selectImageHandler={selectImageHandler}
        selectFolderHandler={selectFolderHandler}
        resetImagePaths={resetImagePaths}
      />
      <MainContent
        imagePath={imagePath}
        resetImagePaths={resetImagePaths}
        upscaledBatchFolderPath={upscaledBatchFolderPath}
        setImagePath={setImagePath}
        validateImagePath={validateImagePath}
        selectFolderHandler={selectFolderHandler}
        selectImageHandler={selectImageHandler}
        batchFolderPath={batchFolderPath}
        upscaledImagePath={upscaledImagePath}
        doubleUpscaylCounter={doubleUpscaylCounter}
        setDimensions={setDimensions}
      />
      <OnboardingDialog />
    </div>
  );
};

export default Home;
