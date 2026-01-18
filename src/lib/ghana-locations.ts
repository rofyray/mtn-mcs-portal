/**
 * Ghana Digital Address System - Regions and District Codes
 *
 * Digital Address Format: XX-XXX-XXXX
 * - XX = District code (first char = region, second = district)
 * - XXX = Area code (3-4 digits)
 * - XXXX = Unique address (4 digits)
 */

// Type definitions
export interface District {
  code: string;       // Full district code: e.g., "GA", "AK", "G2"
  name: string;       // District name: e.g., "Accra Metropolitan"
}

export interface Region {
  code: string;       // Single letter region code: G, A, C, etc.
  name: string;       // Full region name
  districts: District[];
}

export interface GhanaLocationsData {
  [regionCode: string]: Region;
}

// Parsed digital address components
export interface ParsedDigitalAddress {
  districtCode: string;
  areaCode: string;
  uniqueAddress: string;
  region: string;
}

export const ghanaLocations: GhanaLocationsData = {
  G: {
    code: "G",
    name: "Greater Accra Region",
    districts: [
      { code: "GA", name: "Accra Metropolitan" },
      { code: "G2", name: "Ayawaso Central" },
      { code: "G3", name: "Ayawaso North" },
      { code: "G4", name: "Ayawaso West" },
      { code: "G5", name: "Ayawaso East" },
      { code: "G6", name: "Krowor" },
      { code: "G7", name: "Ablekuma Central" },
      { code: "G8", name: "Ablekuma North" },
      { code: "G9", name: "Ablekuma West" },
      { code: "GB", name: "Ashaiman" },
      { code: "GC", name: "Ga Central" },
      { code: "GD", name: "Ga East" },
      { code: "GE", name: "Ga North" },
      { code: "GF", name: "Ga South" },
      { code: "GG", name: "Ga West" },
      { code: "GH", name: "La Dade-Kotopon" },
      { code: "GI", name: "La Nkwantanang Madina" },
      { code: "GJ", name: "Ledzokuku" },
      { code: "GK", name: "Korle Klottey" },
      { code: "GL", name: "Okaikwei North" },
      { code: "GM", name: "Weija Gbawe" },
      { code: "GN", name: "Ada East" },
      { code: "GO", name: "Ada West" },
      { code: "GP", name: "Ningo Prampram" },
      { code: "GQ", name: "Shai Osudoku" },
      { code: "GT", name: "Tema Metropolitan" },
      { code: "GU", name: "Tema West" },
      { code: "GV", name: "Kpone Katamanso" },
    ]
  },
  A: {
    code: "A",
    name: "Ashanti Region",
    districts: [
      { code: "AK", name: "Kumasi Metropolitan" },
      { code: "A2", name: "Adansi North" },
      { code: "A3", name: "Adansi South" },
      { code: "A4", name: "Afigya Kwabre North" },
      { code: "A5", name: "Afigya Kwabre South" },
      { code: "A6", name: "Ahafo Ano North" },
      { code: "A7", name: "Ahafo Ano South East" },
      { code: "A8", name: "Ahafo Ano South West" },
      { code: "A9", name: "Amansie Central" },
      { code: "AA", name: "Amansie South" },
      { code: "AB", name: "Amansie West" },
      { code: "AC", name: "Asante Akim Central" },
      { code: "AD", name: "Asante Akim North" },
      { code: "AE", name: "Asante Akim South" },
      { code: "AF", name: "Asokore Mampong" },
      { code: "AG", name: "Asokwa" },
      { code: "AH", name: "Atwima Kwanwoma" },
      { code: "AI", name: "Atwima Mponua" },
      { code: "AJ", name: "Atwima Nwabiagya North" },
      { code: "AL", name: "Atwima Nwabiagya South" },
      { code: "AM", name: "Bekwai" },
      { code: "AN", name: "Bosome Freho" },
      { code: "AO", name: "Obuasi Municipal" },
      { code: "AP", name: "Obuasi East" },
      { code: "AQ", name: "Bosomtwe" },
      { code: "AR", name: "Ejisu" },
      { code: "AS", name: "Ejura Sekyedumase" },
      { code: "AT", name: "Juaben" },
      { code: "AU", name: "Kwabre East" },
      { code: "AV", name: "Kwadaso" },
      { code: "AW", name: "Mampong" },
      { code: "AX", name: "Nhyiaeso" },
      { code: "AY", name: "Offinso North" },
      { code: "AZ", name: "Offinso South" },
      { code: "A1", name: "Oforikrom" },
      { code: "B1", name: "Old Tafo" },
      { code: "B2", name: "Sekyere Afram Plains" },
      { code: "B3", name: "Sekyere Central" },
      { code: "B4", name: "Sekyere East" },
      { code: "B5", name: "Sekyere Kumawu" },
      { code: "B6", name: "Sekyere South" },
      { code: "B7", name: "Suame" },
    ]
  },
  C: {
    code: "C",
    name: "Central Region",
    districts: [
      { code: "CC", name: "Cape Coast Metropolitan" },
      { code: "C2", name: "Abura Asebu Kwamankese" },
      { code: "C3", name: "Agona East" },
      { code: "C4", name: "Agona West" },
      { code: "C5", name: "Ajumako Enyan Essiam" },
      { code: "C6", name: "Asikuma Odoben Brakwa" },
      { code: "C7", name: "Assin Central" },
      { code: "C8", name: "Assin North" },
      { code: "C9", name: "Assin South" },
      { code: "CA", name: "Awutu Senya East" },
      { code: "CB", name: "Awutu Senya West" },
      { code: "CD", name: "Effutu" },
      { code: "CE", name: "Ekumfi" },
      { code: "CF", name: "Gomoa Central" },
      { code: "CG", name: "Gomoa East" },
      { code: "CH", name: "Gomoa West" },
      { code: "CI", name: "Hemang Lower Denkyira" },
      { code: "CJ", name: "Komenda Edina Eguafo Abirem" },
      { code: "CK", name: "Mfantsiman" },
      { code: "CL", name: "Twifo Atti Morkwa" },
      { code: "CM", name: "Twifo Hemang Lower Denkyira" },
      { code: "CN", name: "Upper Denkyira East" },
      { code: "CO", name: "Upper Denkyira West" },
    ]
  },
  E: {
    code: "E",
    name: "Eastern Region",
    districts: [
      { code: "EK", name: "Koforidua (New Juaben South)" },
      { code: "E2", name: "Abuakwa North" },
      { code: "E3", name: "Abuakwa South" },
      { code: "E4", name: "Achiase" },
      { code: "E5", name: "Akuapem North" },
      { code: "E6", name: "Akuapem South" },
      { code: "E7", name: "Akyemansa" },
      { code: "E8", name: "Asene Manso Akroso" },
      { code: "E9", name: "Asuogyaman" },
      { code: "EA", name: "Atiwa East" },
      { code: "EB", name: "Atiwa West" },
      { code: "EC", name: "Ayensuano" },
      { code: "ED", name: "Birim Central" },
      { code: "EE", name: "Birim North" },
      { code: "EF", name: "Birim South" },
      { code: "EG", name: "Denkyembour" },
      { code: "EH", name: "East Akim" },
      { code: "EI", name: "Fanteakwa North" },
      { code: "EJ", name: "Fanteakwa South" },
      { code: "EL", name: "Kwaebibirem" },
      { code: "EM", name: "Kwahu Afram Plains North" },
      { code: "EN", name: "Kwahu Afram Plains South" },
      { code: "EO", name: "Kwahu East" },
      { code: "EP", name: "Kwahu South" },
      { code: "EQ", name: "Kwahu West" },
      { code: "ER", name: "Lower Manya Krobo" },
      { code: "ES", name: "New Juaben North" },
      { code: "ET", name: "Nsawam Adoagyiri" },
      { code: "EU", name: "Okere" },
      { code: "EV", name: "Suhum" },
      { code: "EW", name: "Upper Manya Krobo" },
      { code: "EX", name: "Upper West Akim" },
      { code: "EY", name: "West Akim" },
      { code: "EZ", name: "Yilo Krobo" },
    ]
  },
  W: {
    code: "W",
    name: "Western Region",
    districts: [
      { code: "WS", name: "Sekondi-Takoradi Metropolitan" },
      { code: "W2", name: "Ahanta West" },
      { code: "W3", name: "Ellembelle" },
      { code: "W4", name: "Jomoro" },
      { code: "W5", name: "Mpohor" },
      { code: "W6", name: "Nzema East" },
      { code: "W7", name: "Prestea Huni Valley" },
      { code: "W8", name: "Shama" },
      { code: "W9", name: "Tarkwa Nsuaem" },
      { code: "WA", name: "Wassa Amenfi Central" },
      { code: "WB", name: "Wassa Amenfi East" },
      { code: "WC", name: "Wassa Amenfi West" },
      { code: "WD", name: "Wassa East" },
      { code: "WE", name: "Effia Kwesimintsim" },
    ]
  },
  V: {
    code: "V",
    name: "Volta Region",
    districts: [
      { code: "VH", name: "Ho Municipal" },
      { code: "V2", name: "Adaklu" },
      { code: "V3", name: "Afadjato South" },
      { code: "V4", name: "Agortime Ziope" },
      { code: "V5", name: "Akatsi North" },
      { code: "V6", name: "Akatsi South" },
      { code: "V7", name: "Anloga" },
      { code: "V8", name: "Central Tongu" },
      { code: "V9", name: "Ho West" },
      { code: "VA", name: "Hohoe" },
      { code: "VB", name: "Keta" },
      { code: "VC", name: "Ketu North" },
      { code: "VD", name: "Ketu South" },
      { code: "VE", name: "Kpando" },
      { code: "VF", name: "North Dayi" },
      { code: "VG", name: "North Tongu" },
      { code: "VI", name: "South Dayi" },
      { code: "VJ", name: "South Tongu" },
    ]
  },
  N: {
    code: "N",
    name: "Northern Region",
    districts: [
      { code: "NT", name: "Tamale Metropolitan" },
      { code: "N2", name: "Gushegu" },
      { code: "N3", name: "Karaga" },
      { code: "N4", name: "Kpandai" },
      { code: "N5", name: "Kumbungu" },
      { code: "N6", name: "Mion" },
      { code: "N7", name: "Nanton" },
      { code: "N8", name: "Nanumba North" },
      { code: "N9", name: "Nanumba South" },
      { code: "NA", name: "Saboba" },
      { code: "NB", name: "Sagnarigu" },
      { code: "NC", name: "Savelugu" },
      { code: "ND", name: "Tatale Sanguli" },
      { code: "NE", name: "Tolon" },
      { code: "NF", name: "Yendi" },
      { code: "NG", name: "Zabzugu" },
    ]
  },
  U: {
    code: "U",
    name: "Upper East Region",
    districts: [
      { code: "UB", name: "Bolgatanga Municipal" },
      { code: "U2", name: "Bawku Municipal" },
      { code: "U3", name: "Bawku West" },
      { code: "U4", name: "Binduri" },
      { code: "U5", name: "Bolgatanga East" },
      { code: "U6", name: "Bongo" },
      { code: "U7", name: "Builsa North" },
      { code: "U8", name: "Builsa South" },
      { code: "U9", name: "Garu" },
      { code: "UA", name: "Kassena Nankana East" },
      { code: "UC", name: "Kassena Nankana West" },
      { code: "UD", name: "Nabdam" },
      { code: "UE", name: "Pusiga" },
      { code: "UF", name: "Talensi" },
      { code: "UG", name: "Tempane" },
    ]
  },
  X: {
    code: "X",
    name: "Upper West Region",
    districts: [
      { code: "XW", name: "Wa Municipal" },
      { code: "X2", name: "Daffiama Bussie Issa" },
      { code: "X3", name: "Jirapa" },
      { code: "X4", name: "Lambussie Karni" },
      { code: "X5", name: "Lawra" },
      { code: "X6", name: "Nadowli Kaleo" },
      { code: "X7", name: "Nandom" },
      { code: "X8", name: "Sissala East" },
      { code: "X9", name: "Sissala West" },
      { code: "XA", name: "Wa East" },
      { code: "XB", name: "Wa West" },
    ]
  },
  B: {
    code: "B",
    name: "Bono Region",
    districts: [
      { code: "BS", name: "Sunyani Municipal" },
      { code: "B2", name: "Berekum East" },
      { code: "B3", name: "Berekum West" },
      { code: "B4", name: "Dormaa Central" },
      { code: "B5", name: "Dormaa East" },
      { code: "B6", name: "Dormaa West" },
      { code: "B7", name: "Jaman North" },
      { code: "B8", name: "Jaman South" },
      { code: "B9", name: "Sunyani West" },
      { code: "BA", name: "Tain" },
      { code: "BB", name: "Wenchi" },
      { code: "BC", name: "Banda" },
    ]
  },
  F: {
    code: "F",
    name: "Ahafo Region",
    districts: [
      { code: "FG", name: "Goaso Municipal" },
      { code: "F2", name: "Asunafo North" },
      { code: "F3", name: "Asunafo South" },
      { code: "F4", name: "Asutifi North" },
      { code: "F5", name: "Asutifi South" },
      { code: "F6", name: "Tano North" },
      { code: "F7", name: "Tano South" },
    ]
  },
  H: {
    code: "H",
    name: "Bono East Region",
    districts: [
      { code: "HT", name: "Techiman Municipal" },
      { code: "H2", name: "Atebubu Amantin" },
      { code: "H3", name: "Kintampo North" },
      { code: "H4", name: "Kintampo South" },
      { code: "H5", name: "Nkoranza North" },
      { code: "H6", name: "Nkoranza South" },
      { code: "H7", name: "Pru East" },
      { code: "H8", name: "Pru West" },
      { code: "H9", name: "Sene East" },
      { code: "HA", name: "Sene West" },
      { code: "HB", name: "Techiman North" },
    ]
  },
  O: {
    code: "O",
    name: "Oti Region",
    districts: [
      { code: "OD", name: "Dambai" },
      { code: "O2", name: "Biakoye" },
      { code: "O3", name: "Guan" },
      { code: "O4", name: "Jasikan" },
      { code: "O5", name: "Kadjebi" },
      { code: "O6", name: "Krachi East" },
      { code: "O7", name: "Krachi Nchumuru" },
      { code: "O8", name: "Krachi West" },
      { code: "O9", name: "Nkwanta North" },
      { code: "OA", name: "Nkwanta South" },
    ]
  },
  S: {
    code: "S",
    name: "Savannah Region",
    districts: [
      { code: "SD", name: "Damongo" },
      { code: "S2", name: "Bole" },
      { code: "S3", name: "Central Gonja" },
      { code: "S4", name: "East Gonja" },
      { code: "S5", name: "North East Gonja" },
      { code: "S6", name: "North Gonja" },
      { code: "S7", name: "Sawla Tuna Kalba" },
      { code: "S8", name: "West Gonja" },
    ]
  },
  J: {
    code: "J",
    name: "North East Region",
    districts: [
      { code: "JN", name: "Nalerigu (East Mamprusi)" },
      { code: "J2", name: "Bunkpurugu Nyankpanduri" },
      { code: "J3", name: "Chereponi" },
      { code: "J4", name: "Mamprugu Moagduri" },
      { code: "J5", name: "West Mamprusi" },
      { code: "J6", name: "Yunyoo Nasuan" },
    ]
  },
  R: {
    code: "R",
    name: "Western North Region",
    districts: [
      { code: "RS", name: "Sefwi Wiawso" },
      { code: "R2", name: "Aowin" },
      { code: "R3", name: "Bia East" },
      { code: "R4", name: "Bia West" },
      { code: "R5", name: "Bibiani Anhwiaso Bekwai" },
      { code: "R6", name: "Bodi" },
      { code: "R7", name: "Juaboso" },
      { code: "R8", name: "Sefwi Akontombra" },
      { code: "R9", name: "Suaman" },
    ]
  }
};
