/**
 * Performance Score Computation Utility
 * Computes weighted performance score (0..1) and tier based on user specs vs game requirements
 */

/**
 * Clamp value between 0 and 1
 * @param {number} v - Value to clamp
 * @returns {number} Clamped value (0..1)
 */
function clamp01(v) {
  if (typeof v !== 'number' || isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * Crude CPU/GPU match: returns 0..1 based on textual match between user and required strings
 * - exact contains -> 1.0
 * - shares model token (i5/i7/1060/GTX) -> 0.7
 * - contains brand only (intel/nvidia/amd) -> 0.4
 * - else 0
 * @param {string} userStr - User's CPU/GPU string
 * @param {string} reqStr - Required CPU/GPU string
 * @returns {number} Match score (0..1)
 */
function crudeCpuGpuMatch(userStr = '', reqStr = '') {
  if (!reqStr) return 0; // no requirement info -> cannot score
  const u = (userStr || '').toLowerCase();
  const r = (reqStr || '').toLowerCase();
  if (!u) return 0;

  // exact token inclusion
  if (u.includes(r) || r.includes(u)) return 1.0;

  // token-based (numbers or model tokens)
  const tokens = r.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (t.length >= 2 && u.includes(t)) {
      // if token like i5, i7, 1060, rtx, gtx, rx, threadripper
      return 0.7;
    }
  }

  // brand-level
  const brands = ['intel', 'amd', 'nvidia', 'geforce', 'radeon', 'gtx', 'rtx', 'rx'];
  for (const b of brands) {
    if (r.includes(b) && u.includes(b)) return 0.4;
  }

  return 0;
}

/**
 * Compute weighted performance score
 * @param {{cpu:string, gpu:string, ramGB:number, storageGB:number, os:string}} user - User system specs
 * @param {{minimum:{cpu, gpu, ram, storage, storageGB, os}, recommended:{...}}} requirements - Game requirements
 * @param {object} weights - Optional weights (default: cpu:0.30, gpu:0.30, ram:0.15, storage:0.15, os:0.10)
 * @returns {{score:number, breakdown:object, tier:string}} Performance score, breakdown, and tier
 */
function computePerformanceScore(user, requirements, weights = null) {
  // Default weights
  const W = Object.assign({
    cpu: 0.30,
    gpu: 0.30,
    ram: 0.15,
    storage: 0.15,
    os: 0.10
  }, weights || {});

  // Normalize user numbers
  const userRam = Number(user.ramGB) || 0;
  const userStorage = Number(user.storageGB) || 0;
  const userOS = (user.os || '').toLowerCase();

  // Pick requirement: prefer recommended if exists else minimum
  const req = (requirements && requirements.recommended && (requirements.recommended.cpu || requirements.recommended.gpu || requirements.recommended.ram || requirements.recommended.storage))
    ? requirements.recommended
    : (requirements ? requirements.minimum : null);

  // Safe defaults
  const reqCpu = req?.cpu || '';
  const reqGpu = req?.gpu || '';
  const reqRamStr = req?.ram || req?.ramGB || '';
  const reqStorageGB = (typeof req?.storageGB === 'number' && req.storageGB > 0) ? req.storageGB :
                       (req?.storage ? Number(String(req.storage).match(/[\d.]+/)?.[0]) : 0);
  const reqRam = (typeof reqRamStr === 'number' && reqRamStr > 0) ? reqRamStr :
                 (reqRamStr ? Number(String(reqRamStr).match(/[\d.]+/)?.[0]) : 0);

  // CPU/GPU scoring (0..1)
  const cpuScore = clamp01(crudeCpuGpuMatch(user.cpu, reqCpu));
  const gpuScore = clamp01(crudeCpuGpuMatch(user.gpu, reqGpu));

  // RAM score: ratio user/required (clamped 0..1)
  let ramScore = 0;
  if (reqRam > 0) {
    ramScore = clamp01(userRam / reqRam);
  } else {
    // no info -> give neutral 0.5 to avoid forcing negative. (optional)
    ramScore = userRam > 0 ? 1 : 0; // or 0.5 ; choose 1 if user has any RAM
  }

  // Storage score
  let storageScore = 0;
  if (reqStorageGB > 0) {
    storageScore = clamp01(userStorage / reqStorageGB);
  } else {
    storageScore = userStorage > 0 ? 1 : 0;
  }

  // OS compatibility: check if req includes OS string
  let osScore = 0;
  const reqOs = (req?.os || requirements?.minimum?.os || '').toString().toLowerCase();
  if (!reqOs) {
    // no OS info -> give 1 (assume compatible)
    osScore = 1;
  } else {
    osScore = reqOs.includes(userOS) || userOS.includes(reqOs) ? 1 : 0;
  }

  // Breakdown components
  const cpuComp = W.cpu * cpuScore;
  const gpuComp = W.gpu * gpuScore;
  const ramComp = W.ram * ramScore;
  const storageComp = W.storage * storageScore;
  const osComp = W.os * osScore;

  // Sum step-by-step (digit-by-digit logic)
  // 1) cpuComp
  // 2) + gpuComp
  // 3) + ramComp
  // 4) + storageComp
  // 5) + osComp
  const s1 = cpuComp;
  const s2 = s1 + gpuComp;
  const s3 = s2 + ramComp;
  const s4 = s3 + storageComp;
  const score = clamp01(s4 + osComp);

  // Determine tier
  let tier = 'Cannot Run';
  if (score >= 0.85) tier = 'Strong';
  else if (score >= 0.6) tier = 'Medium';
  else if (score >= 0.35) tier = 'Weak';
  else tier = 'Cannot Run';

  return {
    score,
    tier,
    breakdown: {
      cpuScore, gpuScore, ramScore, storageScore, osScore,
      cpuComp, gpuComp, ramComp, storageComp, osComp,
      s1, s2, s3, s4
    }
  };
}

export { computePerformanceScore, crudeCpuGpuMatch, clamp01 };

