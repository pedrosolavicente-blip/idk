export type VehicleCategory = "PD" | "FD" | "DOT";

export interface VehicleModel {
  id: string;
  name: string;
  path: string;
  category: VehicleCategory;
}

// Served through the Worker so CORS is never an issue
const R2 = "/previewer/api/models";

const MODELS: VehicleModel[] = [
  {
    id: "averon-q8-2022",
    name: "Averon Q8 2022",
    path: `${R2}/Averon%20Q8%202022.glb`,
    category: "PD",
  },
  {
    id: "bkm-munich-2020",
    name: "BKM Munich 2020",
    path: `${R2}/BKM%20Munich%202020.glb`,
    category: "PD",
  },
  {
    id: "bullhorn-bh15-ssv-2009",
    name: "Bullhorn BH15 SSV 2009",
    path: `${R2}/Bullhorn%20BH15%20SSV%202009.glb`,
    category: "PD",
  },
  {
    id: "bullhorn-determinator-sfp-fury-2022",
    name: "Bullhorn Determinator SFP Fury 2022",
    path: `${R2}/Bullhorn%20Determinator%20SFP%20Fury%202022.glb`,
    category: "PD",
  },
  {
    id: "bullhorn-prancer-fury-widebody-2020",
    name: "Bullhorn Prancer Fury Widebody Pursuit 2020",
    path: `${R2}/Bullhorn%20Prancer%20Fury%20Widebody%20Pursuit%202020.glb`,
    category: "PD",
  },
  {
    id: "bullhorn-prancer-pursuit-2011",
    name: "Bullhorn Prancer Pursuit 2011",
    path: `${R2}/Bullhorn%20Prancer%20Pursuit%202011.glb`,
    category: "PD",
  },
  {
    id: "bullhorn-pueblo-pursuit-2022",
    name: "Bullhorn Pueblo Pursuit 2022",
    path: `${R2}/Bullhorn%20Pueblo%20Pursuit%202022.glb`,
    category: "PD",
  },
  {
    id: "celestial-truckatron-2024",
    name: "Celestial Truckatron 2024",
    path: `${R2}/Celestial%20Truckatron%202024.glb`,
    category: "PD",
  },
  {
    id: "chevlon-antelope-ss-1994",
    name: "Chevlon Antelope SS 1994",
    path: `${R2}/Chevlon%20Antelope%20SS%201994.glb`,
    category: "PD",
  },
  {
    id: "chevlon-camion-ppv-2021",
    name: "Chevlon Camion PPV 2021",
    path: `${R2}/Chevlon%20Camion%20PPV%202021.glb`,
    category: "PD",
  },
  {
    id: "chevlon-commuter-van-2006",
    name: "Chevlon Commuter Van 2006",
    path: `${R2}/Chevlon%20Commuter%20Van%202006.glb`,
    category: "PD",
  },
  {
    id: "chevlon-corbeta-rzr-2014",
    name: "Chevlon Corbeta RZR 2014",
    path: `${R2}/Chevlon%20Corbeta%20RZR%202014.glb`,
    category: "PD",
  },
  {
    id: "chevlon-platoro-ppv-2019",
    name: "Chevlon Platoro PPV 2019",
    path: `${R2}/Chevlon%20Platoro%20PPV%202019.glb`,
    category: "PD",
  },
  {
    id: "falcon-interceptor-utility-2013",
    name: "Falcon Interceptor Utility 2013",
    path: `${R2}/Falcon%20Interceptor%20Utility%202013.glb`,
    category: "PD",
  },
  {
    id: "falcon-interceptor-utility-2024",
    name: "Falcon Interceptor Utility 2024",
    path: `${R2}/Falcon%20Interceptor%20Utility%202024.glb`,
    category: "PD",
  },
  {
    id: "falcon-prime-eques-interceptor-2003",
    name: "Falcon Prime Eques Interceptor 2003",
    path: `${R2}/Falcon%20Prime%20Eques%20Interceptor%202003.glb`,
    category: "PD",
  },
  {
    id: "falcon-stallion-350-2015",
    name: "Falcon Stallion 350 2015",
    path: `${R2}/Falcon%20Stallion%20350%202015.glb`,
    category: "PD",
  },
  {
    id: "mobile-command-2005",
    name: "Mobile Command 2005",
    path: `${R2}/Mobile%20Command%202005.glb`,
    category: "PD",
  },
  {
    id: "sprinter",
    name: "Sprinter",
    path: `${R2}/Sprinter.glb`,
    category: "PD",
  },
  {
    id: "swat-armored-truck-2011",
    name: "SWAT Armored Truck 2011",
    path: `${R2}/SWAT%20Armored%20Truck%202011.glb`,
    category: "PD",
  },
];

export default MODELS;
