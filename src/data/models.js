export const pvModels = {
  'JKM560N-72HL4-BDV': { kwp: '0.560', tech: 'N-type Mono-crystalline Bifacial', eff: '21.68%' },
  'JKM565N-72HL4-BDV': { kwp: '0.565', tech: 'N-type Mono-crystalline Bifacial', eff: '21.87%' },
  'JKM570N-72HL4-BDV': { kwp: '0.570', tech: 'N-type Mono-crystalline Bifacial', eff: '22.07%' },
  'JKM575N-72HL4-BDV': { kwp: '0.575', tech: 'N-type Mono-crystalline Bifacial', eff: '22.26%' },
  'JKM580N-72HL4-BDV': { kwp: '0.580', tech: 'N-type Mono-crystalline Bifacial', eff: '22.45%' },
}

// Properties are characteristic of each chemistry and not user-editable —
// selecting a technology fixes its DoD, round-trip efficiency, duration and
// power-converter rating (power = capacity / duration).
export const bessModels = {
  'Model A - LFP': { cap: '1500', tech: 'LFP (Lithium Iron Phosphate)', dod: 90, rte: 95, duration: 4, power: 375 },
  'Model B - Li-Ion': { cap: '1000', tech: 'Lithium-Ion (Li-Ion)', dod: 90, rte: 92, duration: 2, power: 500 },
  'Model C - Lead-Acid': { cap: '2000', tech: 'Lead-Acid', dod: 50, rte: 80, duration: 6, power: 333 },
  'Model D - Redox Flow': { cap: '3000', tech: 'Redox Flow', dod: 100, rte: 75, duration: 8, power: 375 },
}
