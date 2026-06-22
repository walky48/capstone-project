// Fallback PV panel presets mirrored from the backend GET /api/v1/pv-models.
// The live list is fetched at runtime; this is only used when the API is unreachable.
export const PV_PRESETS = [
  { model: 'Tiger Neo N-type 72HL4-BDV', label: 'Tiger Neo N-type 72HL4-BDV', panel_width_m: 1.134, panel_length_m: 2.278, panel_power_wp: 580, degradation_rate: 0.004 },
  { model: 'CW Energy CWT550-144PM10', label: 'CW Energy CWT550-144PM10', panel_width_m: 1.134, panel_length_m: 2.278, panel_power_wp: 580, degradation_rate: 0.004 },
  { model: 'Smart Solar SS550M10H-24/TH', label: 'Smart Solar SS550M10H-24/TH', panel_width_m: 1.134, panel_length_m: 2.278, panel_power_wp: 550, degradation_rate: 0.004 },
  { model: 'LONGi Hi-MO 6 550 W', label: 'LONGi Hi-MO 6 550 W', panel_width_m: 1.134, panel_length_m: 2.278, panel_power_wp: 550, degradation_rate: 0.004 },
  { model: 'A Solar DeepBlue 4.0 TOPCon', label: 'A Solar DeepBlue 4.0 TOPCon', panel_width_m: 1.134, panel_length_m: 2.278, panel_power_wp: 550, degradation_rate: 0.004 },
]
