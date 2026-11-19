import { Page, Section, Text, Callout, Select, Toggle, Button, Table, Rows, useGrokTheme, useState, useMemo, useEffect, Fragment } from "grok/canvas";
import type { CSSProperties } from "grok/canvas";

const AG: string[] = ["D","C","E","c","e","Cw","K","k","Kpa","Fya","Fyb","Jka","Jkb","M","N","S","s","Lea","Leb","P1","Lua","Xga"];
const LABEL: Record<string,string> = { D:"D",C:"C",E:"E",c:"c",e:"e",Cw:"Cʷ",K:"K",k:"k",Kpa:"Kpᵃ",Fya:"Fyᵃ",Fyb:"Fyᵇ",Jka:"Jkᵃ",Jkb:"Jkᵇ",M:"M",N:"N",S:"S",s:"s",Lea:"Leᵃ",Leb:"Leᵇ",P1:"P₁",Lua:"Luᵃ",Xga:"Xgᵃ" };
const PARTNER: Record<string,string> = { C:"c",c:"C",E:"e",e:"E",Fya:"Fyb",Fyb:"Fya",Jka:"Jkb",Jkb:"Jka",M:"N",N:"M",S:"s",s:"S" };
// Schneck Medical Center Blood Bank Tech Guide: Antibody Identification (11/2026), section 2 "Antigen Exclusion (Rule-Out) Criteria (Only one needed)".
const SCHNECK_DOUBLE: string[] = ["C", "c", "E", "e", "Fya", "Fyb", "Jka", "Jkb", "M", "N", "S", "s"]; // Double-Dose Required
const SCHNECK_SINGLE: string[] = ["D", "K", "P1", "Xga", "Lea", "Leb", "Lua", "Lub"]; // Single-Dose Permitted
const SCHNECK_LFA: string[] = ["V", "Cw", "Kpa", "Jsa", "Lua"]; // may be omitted during the initial exclusion process
// Antigram antigens the guide does not list: k = double dose (K-k+ cell, K is on the antigram); Cw and Kpa = no partner on the antigram, any antigen-positive cell (also LFA).
const SCHNECK_PARTNER: Record<string, string> = { ...PARTNER, k: "K" };
const SCH_N = 1; // "Only one needed"

interface Lot { lot: string; exp: string; donors: string[]; rh: string[]; cells: string[]; other: string[]; brand?: string; product?: string; }
const LOTS: Lot[] = [
  { lot:"6100 26021", exp:"2026-11-21", donors:["M4438CC","M8269AM","M8566AM","M9111LS","M7331CC","M8991AM","M8271AM","M8867AM","M9161AM","M7998AM","M6631CC"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1wR1","R2R2","rr"],
    cells:["0001100111110110101010","0001101100101010100001","0101100100101010100001","0011100101111101010101","0001100101010011101101","1001100100010010001101","1100100100101110110001","1100101101111101001101","1100110101010110101100","1011000101001010110000","0001100101101010101111"], other:["","","","Co(b+)","Co(b+)","U(-)","","","","",""] },
  { lot:"6100 26019", exp:"2026-10-24", donors:["M9004CC","M8429LS","M8967LS","M8118LS","M5530CC","M8956HM","M9073AM","M4266AM","M5757AM","M8135AM","M0460CC"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1wR1","R2R2","R1r"],
    cells:["0001100101010110100001","0001101000111101001100","0101100100101111101100","0011100100101110110101","0001100111110010101101","1001100100011110101101","1100100101001100110001","1100101100101111101100","1100110100111011110101","1011000101110011001001","1101101101101111000111"], other:["","","","","Co(b+)","","","","","Vel(-)","Co(b+), Wr(a+)"] },
  { lot:"6100 26017", exp:"2026-09-26", donors:["M8297AM","M6502AM","M2626CC","M8865LS","M8225CC","M8990AM","M7428LS","M8405AM","M7357LS","M8248AM","M8857LS"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1wR1","R2R2","RzR1"],
    cells:["0001100100101111010111","0001101101010010100101","0101100100111101110100","0011100101101101101101","0001100101111010110001","1001100100010010101101","1100100100101101110101","1100101101010110101101","1100111100101111101001","1011000110110101001111","1110100101011101100001"], other:["","","Co(b+)","Co(b+)","","","","","","",""] },
  { lot:"6100 26015", exp:"2026-08-29", donors:["M6398CC","M8464AM","M6411TR","M7949AM","M8824AM","M8941LS","M8817LS","M8541AM","M8858AM","M8089AM","M8415LS"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1wR1","R2R2","R1R2"],
    cells:["0001100101001100110101","0001101101010111101100","0101100101001111100101","0011100100101010101111","0001100110111011001110","1001100100010010101101","1100100100101100101101","1100101100101100100100","1100110101011111110101","1011000100110010110001","1111101001111101001001"], other:["","Co(b+)","","","","","","","Co(b+)","",""] },
  { lot:"6100 26013", exp:"2026-08-01", donors:["M8336AM","M8307HM","M5587CB","M8268AM","M4077HM","M8581AM","M7522HM","M8539CC","M8299HO","M8263AM","M7983AM"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1R1w","R2R2","RzR2"],
    cells:["0001100101010011010101","0001101100110101110101","0101100100101110101101","0011100100101111101000","0001100111011010101101","1001100100010111100001","1100100101111101001110","1100101101101110110101","1100110100110110101101","1011000101010110110001","1111000100101010101100"], other:["","","","","Co(b+)","","Wr(a+)","","","","C printed +w"] },
  { lot:"6100 24015", exp:"2024-08-3x", donors:["M7747AM","M7822AM","M7212LS","M4246HO","M7113CC","M4138CC","M7542AM","M6912AM","M3406CC","M3818CC","M7837CF"], rh:["rr","rr","r'r","r''r","rr","R0r","R1R1","R1R1","R1R1w","R2R2","RzR2"],
    cells:["0001100101001101001100","0001101001011101110101","0101100101110100100101","0011100100101010101101","0001100110110101101001","1001100100010110101100","1100100100101011010001","1100101100101111101100","1100110101111110101101","1011000100111010101110","1111000101011100101101"], other:["","","P1 printed +w","","","Js(a+)","","P1 printed +vw","","Lu(b-)","C printed +w"] },
];
const SCREENS: Lot[] = [
{lot:"6435 26021",exp:"2026-11-21",donors:["M8169HM","M9291AM"],rh:["R1R1","R2R2"],cells:["1100100100110101010101","1011001101001110101001"],other:["Co(b+)",""]},
{lot:"6435 26017",exp:"2026-09-26",donors:["M8169HM","M7374LS"],rh:["R1R1","R2R2"],cells:["1100100100110101010101","1011001101001111101011"],other:["Co(b+)",""]},
{lot:"6435 26015",exp:"2026-08-29",donors:["M8169HM","M7374LS"],rh:["R1R1","R2R2"],cells:["1100100100110101010101","1011001101001111101011"],other:["Co(b+)",""]},
{lot:"6435 26013",exp:"2026-08-01",donors:["M8819LS","M4870HO"],rh:["R1R1","R2R2"],cells:["1100100100101010101100","1011001101010101010101"],other:["",""]},
{lot:"6435 26011",exp:"2026-07-04",donors:["M4089AM","M4196AM"],rh:["R1R1","R2R2"],cells:["1100100101010011010001","1011001100101110101101"],other:["",""]},
{lot:"6435 26009",exp:"2026-06-06",donors:["M5328AM","M6755HM"],rh:["R1R1","R2R2"],cells:["1100100100110011110101","1011001101001111001001"],other:["",""]},
{lot:"6435 26007",exp:"2026-05-09",donors:["M5415AM","M8357AM"],rh:["R1R1","R2R2"],cells:["1100101101010010110001","1011000100101101001101"],other:["",""]},
{lot:"6435 26005",exp:"2026-04-11",donors:["M4089AM","M8175CF"],rh:["R1R1","R2R2"],cells:["1100100101010011010001","1011001100101110101100"],other:["","Pen marks over E and K on the sheet"]},
{lot:"6435 26003",exp:"2026-03-14",donors:["M8201LS","M6351AM"],rh:["R1R1","R2R2"],cells:["1100101100110010101101","1011000101001101010001"],other:["",""]},
{lot:"6435 26001",exp:"2026-02-14",donors:["M5183AM","M8378AM"],rh:["R1R1","R2R2"],cells:["1100100100101111010101","1011001101010010101100"],other:["Co(b+)",""]},
{lot:"6435 25025",exp:"2026-01-17",donors:["M8152LS","M6786HM"],rh:["R1R1","R2R2"],cells:["1100100100110110101101","1011001101001101010001"],other:["",""]},
{lot:"6435 25023",exp:"2025-12-20",donors:["M3879AM","M8291CF"],rh:["R1R1","R2R2"],cells:["1100100101001111010101","1011001100110110101101"],other:["","Co(b+)"]},
{lot:"6435 25021",exp:"2025-11-22",donors:["M8244AM","M7424LS"],rh:["R1R1","R2R2"],cells:["1100101100110011110101","1011000101001100101101"],other:["",""]},
{lot:"6435 25019",exp:"2025-10-25",donors:["M7861AM","M8183AM"],rh:["R1R1","R2R2"],cells:["1100101100101010110001","1011000101010101010101"],other:["Co(b+)",""]},
{lot:"6435 25017",exp:"2025-09-27",donors:["M8152LS","M6786HM"],rh:["R1R1","R2R2"],cells:["1100100100110110101101","1011001101001101010001"],other:["",""]},
{lot:"6435 25015",exp:"2025-08-30",donors:["M8054AM","M4870HO"],rh:["R1R1","R2R2"],cells:["1100100100101110101101","1011001101010101010101"],other:["",""]},
{lot:"6435 25013",exp:"2025-08-02",donors:["M4561AM","M7541CC"],rh:["R1R1","R2R2"],cells:["1100100101010111010101","1011001100101100101101"],other:["",""]},
{lot:"6435 25011",exp:"2025-07-05",donors:["M4372AM","M8138LS"],rh:["R1R1","R2R2"],cells:["1100101101001110110101","1011000100110101001101"],other:["K + is circled in pen on the sheet",""]},
{lot:"6435 25009",exp:"2025-06-07",donors:["M3879AM","M8078HM"],rh:["R1R1","R2R2"],cells:["1100100101001111010101","1011000100110110101101"],other:["",""]},
{lot:"6435 25007",exp:"2025-05-10",donors:["M7653AM","M7964LS"],rh:["R1R1","R2R2"],cells:["1100101100101111010111","1011000101010100101101"],other:["",""]},
{lot:"6435 25005",exp:"2025-04-12",donors:["M5709AM","M7999AM"],rh:["R1R1","R2R2"],cells:["1100101100101110110000","1011001101010101001101"],other:["",""]},
{lot:"6435 25003",exp:"2025-03-15",donors:["M6330HO","M5762AM"],rh:["R1R1","R2R2"],cells:["1100101101010010101100","1011000100101101010101"],other:["","P1 printed +w"]},
{lot:"6435 25001",exp:"2025-02-15",donors:["M7948LS","M4870HO"],rh:["R1R1","R2R2"],cells:["1100100100101110101101","1011001101010101010101"],other:["P1 printed +w",""]},
{lot:"6435 24023",exp:"2024-12-21",donors:["M7953LS","M4870HO"],rh:["R1R1","R2R2"],cells:["1100100100101110101101","1011001101010101010101"],other:["P1 printed +w",""]},
{lot:"6435 24021",exp:"2024-11-23",donors:["M5644AM","M6052LS"],rh:["R1R1","R2R2"],cells:["1100100100110111010001","1011001101001110101100"],other:["Co(b+)","P1 printed +w"]},
{lot:"6435 24019",exp:"2024-10-26",donors:["M7912AM","M6052LS"],rh:["R1R1","R2R2"],cells:["1100100100110101010101","1011001101001110101100"],other:["P1 printed +w","P1 printed +w"]},
{lot:"6435 24017",exp:"2024-09-28",donors:["M7868CF","M7833AM"],rh:["R1R1","R2R2"],cells:["1100101101010110110101","1011000100101111001100"],other:["P1 printed +w","Co(b+)"]},
{lot:"6435 24015",exp:"2024-08-31",donors:["M5589AM","M7806AM"],rh:["R1R1","R2R2"],cells:["1100101100101110110101","1011000101010101001101"],other:["P1 printed +vw","P1 printed +w"]},
{lot:"6435 24007",exp:"2024-05-11",donors:["M5589AM","M7175AM"],rh:["R1R1","R2R2"],cells:["1100101100101110110101","1011001101010011001101"],other:["P1 printed +vw",""]}
];
const TODAY = "2026-10-31";
// Brand/product per lot; add another manufacturer's lots with their own brand and product.
const B_SCREENS: Lot[] = SCREENS.map((l: Lot) => ({ ...l, brand: "Grifols", product: "Search-Cyte Plus 0.8%" }));
const B_LOTS: Lot[] = LOTS.map((l: Lot) => ({ ...l, brand: "Grifols", product: "Data-Cyte Plus" }));
const BRANDS: string[] = Array.from(new Set([...B_SCREENS, ...B_LOTS].map((l: Lot) => l.brand as string)));
const GRADES = ["", "0", "w", "1+", "2+", "3+", "4+", "nt"];
const PHASES = ["", "IS", "37", "AHG"];
const GROUPS: { name: string; n: number; bold?: boolean }[] = [{ name: "Rh", n: 6 }, { name: "Kell", n: 3 }, { name: "Duffy", n: 2, bold: true }, { name: "Kidd", n: 2 }, { name: "MNS", n: 4, bold: true }, { name: "Lewis", n: 2 }, { name: "P1PK", n: 1 }, { name: "Luth.", n: 1 }, { name: "Xg", n: 1, bold: true }];
const YEL = "rgba(255, 228, 77, 0.38)";
// Bio-Rad "Characteristics of Blood Group Antibodies" chart (Bulletin H005165, 2019/02), transcribed verbatim.
// Row: [antibody, ISBT, IgM, IgG, Saline RT, IAT 37°C, Papain 37°C, May show dosage, Complement binding, HDFN, HTR, frequency cells [text, colspan], remarks]
type BR = [string, string, string, string, string, string, string, string, string, string, string, [string, number][], string];
const BIORAD: [string, BR[]][] = [
  ["ABO (ISBT No 001) & H Blood Group (ISBT No 018) Systems", [
    ["Anti-A", "ABO1", "Yes", "Yes", "Yes for IgM component", "Yes for IgG component", "↑↑", "", "Yes, some hemolytic", "No to moderate", "No to severe", [["43", 1], ["27", 1], ["Asians: 28; Mexicans: 28; South American Indians: 0", 1]], ""],
    ["Anti-B", "ABO2", "Yes", "Yes", "Yes for IgM component", "Yes for IgG component", "↑↑", "", "Yes, some hemolytic", "No to moderate", "No to severe", [["9", 1], ["20", 1], ["Asians: 27; Mexicans: 13; South American Indians: 0", 1]], ""],
    ["Anti-A,B", "ABO3", "Yes", "Yes", "Yes for IgM component", "Yes for IgG component", "↑↑", "", "Rare", "No to severe", "None to mild/delayed", [["56", 1], ["51", 1], ["Asians: 57; Mexicans: 45", 1]], "Anti-A,B is only produced by group O individuals, and cannot be separated into anti-A and anti-B."],
    ["Anti-A₁", "ABO4", "Yes", "Rare", "Yes", "Rare", "↑↑", "", "Rare", "No", "None to mild/delayed", [["34", 1], ["19", 1], ["Asians: 27", 1]], "Frequency: 1-2% in blood group A₂, 25% in blood group A₂B, 99% in blood group Aₓ."],
    ["Anti-H", "H1", "Yes", "Rare", "Yes", "Rare", "↑↑", "", "Some", "Possible in Oₕ mothers", "No to severe in Oₕ and H+ʷ", [["All populations: 99.9", 3]], "Alloanti-H is present in the serum of Bombay (Oₕ) and Para-Bombay (H+ʷ) people. O cells show the strongest antigen expression, A₁B cells the weakest."],
  ]],
  ["MNS (ISBT No 002) Blood Group System", [
    ["Anti-M", "MNS1", "Yes", "Yes", "IgM and IgG", "Rare", "↓↓", "Yes", "", "No (except in extremely rare cases)", "No (except in extremely rare cases)", [["78", 1], ["74", 1], ["", 1]], "Many examples are naturally-occurring. May be pH dependent. More common in children, and in patients with bacterial infections."],
    ["Anti-N", "MNS2", "Yes", "Yes", "IgM and IgG", "Rare", "↓↓", "Yes", "", "No", "No", [["72", 1], ["75", 1], ["", 1]], "Many examples are naturally-occurring. Rare N-S-s-U- individuals make an antibody that reacts with N on GPA and GPB, and is usually clinically significant."],
    ["Anti-S", "MNS3", "Some", "Most", "Some", "Most", "V", "Yes", "Some", "No to severe (rare)", "No to moderate (rare)", [["55", 1], ["31", 1], ["", 1]], "The S antigen is sensitive to trace amounts of chlorine."],
    ["Anti-s", "MNS4", "Yes", "Yes", "Some", "Most", "V", "Yes", "Rare", "No to severe (rare)", "No to mild (rare)", [["89", 1], ["93", 1], ["", 1]], "Reacts often by IAT after incubation at RT or lower. A pH of 6.0 enhances the reactivity of some anti-s."],
    ["Anti-U", "MNS5", "", "Yes", "No", "Yes", "↔", "", "", "Mild to severe", "Mild to severe", [["99.9", 1], ["99", 1], ["", 1]], "Autoantibody has been identified to cause WAIHA in rare cases."],
  ]],
  ["P1PK (ISBT No 003) & GLOB (ISBT No 028) Blood Group Systems", [
    ["Anti-P1", "P1PK1", "Yes", "Rare", "Yes", "Very rare", "↑↑", "", "Rare", "No", "No to moderate/delayed (rare)", [["79", 1], ["94", 1], ["Cambodian, Vietnamese: 20", 1]], "There is considerable variation in the strength of P1 expression on RBC’s. This variation is inherited, and at least partially dependent on the zygosity of P¹ alleles."],
    ["Anti-P", "GLOB1", "Yes", "Yes", "Some", "Some", "↑↑", "", "Yes, some hemolytic", "No to mild (in Pᵏ mothers with anti-P)", "No to severe (rare)", [["All populations: > 99.9", 3]], "Autoanti-P exists as a biphasic autohemolysin in PCH, detected by the Donath-Landsteiner test may occur after viral illness, particularly in children."],
    ["Anti-PP1Pᵏ (Tjᵃ)", "", "", "Yes", "Some", "Some", "↑↑", "", "Yes", "Yes", "Yes", [["100", 1], ["", 2]], "Alloantibody in sera of p- people may cause complete hemolysis in fresh serum. Anti-PP1Pᵏ is a potential cause of early abortion."],
  ]],
  ["Rh (ISBT No 004) Blood Group System", [
    ["Anti-D", "RH1", "Some", "Most", "Rare", "Yes", "↑↑", "", "Extremely rare", "Mild to severe", "Mild to severe/immediate or delayed", [["85", 1], ["92", 1], ["Asians: 99; Native Americans: 99", 1]], "Occurs frequently with anti-C."],
    ["Anti-C", "RH2", "Yes", "Yes", "Rare", "Yes", "↑↑", "Yes", "No", "Mild", "Mild to severe/immediate or delayed", [["68", 1], ["27", 1], ["Asians: 93", 1]], "Anti-C is often found in antibody mixtures, especially with anti-G or anti-D."],
    ["Anti-E", "RH3", "Yes", "Yes", "Some", "Yes", "↑↑", "Yes", "No", "Mild", "Mild to severe/immediate or delayed", [["29", 1], ["22", 1], ["Asians: 39", 1]], "Occurs frequently with anti-c."],
    ["Anti-c", "RH4", "Some", "Most", "Rare", "Yes", "↑↑", "Yes", "No", "Mild to severe", "Mild to severe/immediate or delayed", [["80", 1], ["98", 1], ["Asians: 47", 1]], "Occurs frequently with anti-E."],
    ["Anti-e", "RH5", "Some", "Most", "Rare", "Yes", "↑↑", "Yes", "No", "Rare, usually mild", "Mild to moderate/delayed/hemoglobinuria", [["98", 2], ["Asians: 96", 1]], "Occurs frequently with anti-C."],
    ["Anti-Cʷ", "RH8", "Yes", "Yes", "Yes", "Yes", "↑↑", "", "No", "Mild to moderate", "Mild to severe/immediate or delayed", [["2", 1], ["1", 1], ["Finns: 4; Latvians: 9", 1]], "Most Cʷ+ are C+; rare examples are C-."],
  ]],
  ["Lutheran (ISBT No 005) Blood Group System", [
    ["Anti-Luᵃ", "LU1", "Yes", "Yes", "Most", "Some", "↔ to ↓", "", "Rare", "No to mild (rare)", "No", [["8", 1], ["5", 1], ["", 1]], "Characteristic reaction picture of “loose” agglutinates surrounded by unagglutinated RBCs in tube technique. Sera containing anti-Luᵃ often also contain HLA antibodies."],
    ["Anti-Luᵇ", "LU2", "Yes", "Yes", "Some", "Most", "↔ to ↓", "", "Rare", "Mild", "Mild to moderate", [["All populations: 99.8", 3]], ""],
    ["Anti-Lu3", "LU3", "", "Yes", "No", "Yes", "↔", "", "Rare", "No data", "No data", [["All populations: 100", 3]], "Anti-Lu3 is only made by immunized individuals of the rare recessive type Lu(a-b-)."],
  ]],
  ["Kell (ISBT No 006) Blood Group System", [
    ["Anti-K", "KEL1", "Some", "Most", "Some", "Yes", "↔", "", "Rare", "Mild to severe (rare)", "Mild to severe/delayed/hemolytic", [["9", 1], ["2", 1], ["Asians: rare; Iranian Jews: 12; Arabs: 25", 1]], "Anti-K may not react well by LISS procedures. Some bacteria trigger production of IgM anti-K. Expression of K can be acquired through bacterial activity in vivo and in vitro."],
    ["Anti-k", "KEL2", "Rare", "Most", "Rare", "Yes", "↔", "", "No", "Mild to severe (rare)", "Mild to moderate/delayed", [["99.8", 1], ["100", 1], ["", 1]], ""],
    ["Anti-Kpᵃ", "KEL3", "", "Yes", "Very rare", "Yes", "↔", "", "No", "Mild to severe", "Mild to moderate/delayed", [["2", 1], ["< 0.01", 1], ["", 1]], "In the presence of Kpᵃ, other inherited Kell antigens are suppressed (cis-modifying effect) to varying degrees. Anti-Kpᵃ appears often combined with anti-K."],
    ["Anti-Kpᵇ", "KEL4", "Rare", "Yes", "Rare", "Yes", "↔", "", "No", "Mild to moderate", "No to moderate/delayed", [["100", 3]], "Sera containing anti-Kpᵇ often contain anti-K."],
    ["Anti-Jsᵃ", "KEL6", "Rare", "Most", "Rare", "Yes", "↔ to ↑", "", "No", "Mild to severe", "No to moderate/delayed", [["< 0.01", 1], ["20", 1], ["", 1]], ""],
    ["Anti-Jsᵇ", "KEL7", "", "Yes", "Very rare", "Yes", "↔ to ↑", "", "No", "Mild to severe", "Mild to moderate/delayed", [["100", 1], ["99", 1], ["", 1]], ""],
  ]],
  ["Lewis (ISBT No 007) Blood Group System", [
    ["Anti-Leᵃ", "LE1", "Most", "Some", "Yes", "Some", "↑↑", "", "Yes, some hemolytic", "No (one mild case)", "No (rare cases of hemolytic reactions)", [["22", 1], ["23", 1], ["", 1]], "Anti-Leᵃ and anti-Leᵇ in conjunction are frequently naturally occurring antibodies made by Le(a-b-) people, especially during pregnancy."],
    ["Anti-Leᵇ", "LE2", "Most", "Some", "Yes", "Some", "↑↑", "", "Yes, some hemolytic", "No", "No", [["72", 1], ["55", 1], ["", 1]], "There are two kinds of anti-Leᵇ: anti-Leᵇᴴ (LE4), reacting with group O and A₂ Le(b+) RBCs, and anti-Leᵇᴸ, reacting with all Le(b+) RBCs. Other antibodies react specifically with the compound antigens, e.g., ALeᵇ (LE5) and BLeᵇ (LE6)."],
  ]],
  ["Duffy (ISBT No 008) Blood Group System", [
    ["Anti-Fyᵃ", "FY1", "Rare", "Yes", "Very rare", "Yes", "↓↓", "Some", "Rare", "Mild to severe (rare)", "Mild to severe (rare)/immediate/delayed", [["66", 1], ["10", 1], ["Asians: 99; Thais: 97", 1]], ""],
    ["Anti-Fyᵇ", "FY2", "Very rare", "Yes", "Very rare", "Yes", "↓↓", "Some", "Rare", "Mild (rare)", "Mild to severe (rare)/immediate (rare)/delayed", [["83", 1], ["23", 1], ["Chinese: 9.2; Asians: 18.5; Thais: 31", 1]], ""],
    ["Anti-Fy3", "FY3", "", "Yes", "", "Yes", "↔", "Yes", "Rare", "Mild (rare)", "Mild to moderate/immediate (rare)/delayed/hemolytic", [["100", 1], ["32", 1], ["Asians: 99.9; Yemeni Jews: 99; Israeli Jews: 96; Israeli Arabs: 75", 1]], ""],
  ]],
  ["Kidd (ISBT No 009) Blood Group System", [
    ["Anti-Jkᵃ", "JK1", "Yes, many IgG + IgM", "Yes, many IgG + IgM", "Rare", "Yes", "↑", "Some", "Yes if IgM present, some hemolytic", "Mild to moderate (rare)", "No to severe/immediate or delayed/hemolytic", [["77", 1], ["92", 1], ["Asians: 72", 1]], "Anti-Jkᵃ deteriorates in vitro and in vivo."],
    ["Anti-Jkᵇ", "JK2", "Yes, many IgG + IgM", "Yes, many IgG + IgM", "Rare", "Yes", "↑", "Some", "Yes if IgM present, some hemolytic", "No to mild (rare)", "No to severe/immediate or delayed/hemolytic", [["74", 1], ["49", 1], ["Asians: 76", 1]], "Anti-Jkᵇ deteriorates in vitro and in vivo."],
    ["Anti-Jk3", "JK3", "Rare", "Yes", "Rare", "Yes", "↑", "", "Yes, some hemolytic", "No to mild", "No to severe/immediate or delayed", [["100", 2], ["Polynesians, Finns: > 99", 1]], ""],
  ]],
  ["Diego (ISBT No 010) Blood Group System", [
    ["Anti-Diᵃ", "DI1", "", "Yes (often IgG1 and IgG3)", "", "Yes", "↔", "", "Some", "Mild to severe", "No to severe/delayed", [["Most populations: 0.01; South American Indians: from 2 in Caracas Indians to 54 in Kainganges Indians; Japanese: 12, Chippewa Indians (Canada): 11, Chinese: 5, Hispanics: 1, Poles: 0.47", 3]], ""],
    ["Anti-Diᵇ", "DI2", "", "Yes", "", "Yes", "↔", "Yes", "No", "Mild", "No to moderate/delayed", [["Most populations: 100; Native Americans: 99", 3]], ""],
    ["Anti-Wrᵃ", "DI3", "Yes", "Yes", "Yes", "Yes", "↔", "", "", "Mild to severe", "No to severe/immediate or delayed/hemolytic", [["All populations: < 0.01", 3]], "Alloanti-Wrᵃ is often a naturally-occurring antibody and is found in the serum of 1-2% of blood donors. It is frequently found in multispecific sera and is a common specificity in patients with AIHA."],
  ]],
  ["Yt (ISBT No 011) Blood Group System", [
    ["Anti-Ytᵃ", "YT1", "", "Yes (some are IgG4)", "", "Yes", "V", "", "Some", "No", "No to moderate (rare)/delayed", [["Most populations: > 99.8; Israeli Jews: 98.6, Israeli Arabs: 97.6, Israeli Druse: 97.4", 3]], "Experts agree that anti-Ytᵃ are often benign and antigen-negative blood may not need to be transfused."],
    ["Anti-Ytᵇ", "YT2", "", "Yes", "", "Yes", "V", "", "", "No", "No", [["Europeans: 8, Israeli Jews: 21.3, Israeli Arabs: 23.5, Israeli Druse: 26; Not found in Japanese", 3]], "Anti-Ytᵇ is rare and usually occurs in sera with other antibodies."],
  ]],
  ["Xg (ISBT No 012) Blood Group System", [
    ["Anti-Xgᵃ", "XG1", "Rare", "Most", "Some", "Most", "↓↓", "", "Some", "No", "No", [["89 Females, 66 Males", 3]], ""],
  ]],
  ["Dombrock (ISBT No 014) Blood Group System", [
    ["Anti-Doᵃ", "DO1", "", "Yes", "", "Yes", "↑", "", "", "Positive DAT but no clinical HDFN", "Delayed and acute/hemolytic", [["67", 1], ["55", 1], ["Japanese: 24; Thais: 14", 1]], "Anti-Doᵃ is notorious for disappearing in vivo."],
    ["Anti-Doᵇ", "DO2", "", "Yes", "", "Yes", "↑", "", "", "Positive DAT but no clinical HDFN", "Acute and delayed", [["82", 1], ["89", 1], ["", 1]], ""],
  ]],
  ["Colton (ISBT No 015) Blood Group System", [
    ["Anti-Coᵃ", "CO1", "Very rare", "Yes", "", "Yes", "↔", "", "Some", "Mild to severe (rare)", "No to moderate/delayed/immediate/hemolytic", [["All populations: 99.5", 3]], ""],
    ["Anti-Coᵇ", "CO2", "", "Yes", "", "Yes", "↔", "", "Rare", "Mild", "No to moderate/delayed/hemolytic", [["All populations: 10", 3]], ""],
  ]],
  ["Chido/Rodgers (ISBT No 017) Blood Group System", [
    ["Anti-Ch1", "CH/RG1", "", "Yes (mostly IgG2 and IgG4)", "", "Yes", "↓", "", "", "No", "Not hemolytic", [["Most populations: 96", 2], ["Japanese: 99", 1]], "Most anti-Ch1 are IgG2 and IgG4. A few reports describe anaphylactic transfusion reactions from plasma products and platelets. Soluble plasma antigen in donor blood may neutralise patient’s antibody. Anti-Ch1 reacts strongly with C4-coated RBCs."],
    ["Anti-Rg1", "CH/RG11", "", "Yes", "", "Yes", "↓", "", "", "No", "Not hemolytic", [["All populations: > 98", 3]], "A few reports describe anaphylactic transfusion reactions from plasma products and platelets."],
  ]],
  ["Knops (ISBT No 022) Blood Group System", [
    ["Anti-Knᵃ", "KN1", "", "Yes", "", "Yes", "↓", "", "", "No", "No", [["94.5", 1], ["99.9", 1], ["", 1]], ""],
    ["Anti-McCᵃ", "KN3", "", "Yes", "", "Yes", "↓", "", "", "No", "No", [["98", 1], ["94", 1], ["", 1]], ""],
    ["Anti-Ykᵃ", "KN5", "", "Yes", "", "Most", "↓", "", "", "No", "No", [["92", 1], ["98", 1], ["", 1]], ""],
  ]],
  ["John Milton Hagen, JMH (ISBT No 026) Blood Group System", [
    ["Anti-JMH", "JMH1", "", "Yes", "", "Yes", "↓", "", "", "No", "No", [["All populations: 100", 3]], "JMH— or JMH-weak phenotypes can be (transiently) acquired; anti-JMH in that case is mostly IgG4."],
  ]],
  ["I (ISBT No 027) Blood Group System & Ii (ISBT No 207) Blood Group Collection", [
    ["Anti-I", "I1", "Yes", "Rare", "Yes", "Very rare", "↑↑", "", "Yes, some hemolytic", "No", "No", [["Adults: > 99", 3]], "Most common cold autoantibody, rare alloantibody in I— (adult i), high titre at 0-4°C, wide thermal range, associated with CHAD and Mycoplasma pneumoniae infection."],
    ["Anti-i", "I2", "Yes", "Rare", "Most", "Very rare", "↑↑", "", "Yes, some hemolytic", "Rare", "No", [["100", 1], ["", 2]], "Autoantibody can occur in serum of people with infectious mononucleosis and some lymphoproliferative disorders."],
  ]],
  ["JR (ISBT No 032) Blood Group System", [
    ["Anti-Jrᵃ", "JR1", "Some", "Yes", "", "Yes", "↑", "", "Some", "Positive DAT but usually no HDFN; however one fatal case of HDFN", "Probably", [["All populations: > 99", 3]], "The Jr(a-) phenotype has been found mostly in Japanese and other Asians, but also in persons of northern European extraction, Bedouin Arabs, and in one Mexican."],
  ]],
  ["Lan (ISBT No 033) Blood Group System", [
    ["Anti-Lan", "LAN1", "", "Yes", "", "Yes", "↔", "", "Some", "No to mild", "No to severe/hemolytic", [["All populations: > 99", 3]], "The Lan— phenotypes found in about 1 in 20,000 people; found in Blacks, Caucasians and Japanese."],
  ]],
  ["Vel (ISBT No 034) Blood Group System", [
    ["Anti-Vel", "VEL1", "Yes (usually a mixture of IgM and IgG)", "Yes (usually a mixture of IgM and IgG)", "", "Yes", "↑↑", "", "Yes, some hemolytic", "Positive DAT to severe", "No to severe/hemolytic", [["All populations: > 99.9", 3]], "Red cells with a weak Vel expression may be mistyped as Vel-. Vel- RBCs have been found in 1 in ~4,000 people and 1 in ~1,700 in Norwegians and Swedes."],
  ]],
  ["Cost (ISBT No 205) Blood Group Collection", [
    ["Anti-Csᵃ", "COST1", "", "Yes", "", "Yes", "↔", "", "", "No", "No", [["Most populations: > 98", 1], ["95", 1], ["", 1]], ""],
    ["Anti-Csᵇ", "COST2", "", "Yes", "", "Yes", "↔", "", "", "", "", [["Most populations: 34", 3]], "Only one example of antibody is published."],
  ]],
];
// Cell shading, matching the chart: Saline RT blue, IAT green, Papain red; darker = more frequent / stronger.
const BR_BLUE: Record<string, string> = { "Yes": "#1f5aa6", "Most": "#4a74bd", "IgM and IgG": "#7d93cf", "Yes for IgM component": "#9aa8d6", "Some": "#c9cfe8", "Rare": "#e3e6f3", "Very rare": "#e3e6f3" };
const BR_GREEN: Record<string, string> = { "Yes": "#0b8a45", "Most": "#35a05f", "Some": "#93c99b", "Yes for IgG component": "#66b37a", "Rare": "#cfe5cf", "Very rare": "#cfe5cf" };
const BR_RED: Record<string, string> = { "↑↑": "#d42027", "↑": "#dc4535", "↔": "#e36b55", "↔ to ↓": "#e36b55", "↔ to ↑": "#e36b55", "V": "#ec9a80", "↓": "#f3c9bb", "↓↓": "#f9e2da" };
const BR_DARK = new Set(["#1f5aa6", "#4a74bd", "#0b8a45", "#35a05f", "#d42027", "#dc4535"]);
const BR_MAROON = "#8a2448";
// Dosage reference. Row: [system, antigen pair, shows dosage, homozygous example, heterozygous example, notes, sources]
const DOSE: [string, string, string, string, string, string, string][] = [
  ["Rh", "C / c", "Yes", "C+c− (for C); C−c+ (for c)", "C+c+", "Bio-Rad 'May show dosage': Yes for anti-C and anti-c.", "A, B, G"],
  ["Rh", "E / e", "Yes", "E+e− (for E); E−e+ (for e)", "E+e+", "Bio-Rad 'May show dosage': Yes for anti-E and anti-e.", "A, B, G"],
  ["Rh", "D", "No", "n/a", "n/a", "D has no antithetical antigen, so there is no homozygous/heterozygous cell comparison; the dosage rule for Rh excludes D. Bio-Rad 'May show dosage' is blank for anti-D. D expression does vary by phenotype (e.g. stronger on R2R2).", "A, B, G"],
  ["Kidd", "Jkᵃ / Jkᵇ", "Yes", "Jk(a+b−) (for Jkᵃ); Jk(a−b+) (for Jkᵇ)", "Jk(a+b+)", "Bio-Rad 'May show dosage': Some. Kidd antibodies are often weak and evanescent, so panels should include both homozygous phenotypes.", "A, B, C"],
  ["Duffy", "Fyᵃ / Fyᵇ", "Yes", "Fy(a+b−) (for Fyᵃ); Fy(a−b+) (for Fyᵇ)", "Fy(a+b+)", "Bio-Rad 'May show dosage': Some. Fy(a−b−) (Duffy-null) cells lack both antigens and are common in Black individuals (about 67%).", "A, B, D"],
  ["MNS", "M / N", "Yes", "M+N− (for M); M−N+ (for N)", "M+N+", "Bio-Rad 'May show dosage': Yes for anti-M and anti-N.", "A, B, G"],
  ["MNS", "S / s", "Yes", "S+s− (for S); S−s+ (for s)", "S+s+", "Bio-Rad 'May show dosage': Yes for anti-S and anti-s.", "A, B, G"],
  ["Kell", "K / k", "No", "K+k−", "K+k+", "Anti-K reacts well with K+k+ and K+k− cells (no dosage). Bio-Rad 'May show dosage' is blank for anti-K and anti-k.", "A, E"],
  ["Kell", "Kpᵃ / Kpᵇ", "Not verified", "Kp(a−b+) (for Kpᵇ)", "Kp(a+b+)", "Bio-Rad 'May show dosage' is blank. Dosage status not verified in the sources checked.", "A"],
  ["Kell", "Jsᵃ / Jsᵇ", "Not verified", "Js(a−b+) (for Jsᵇ)", "Js(a+b+)", "Bio-Rad 'May show dosage' is blank. Dosage status not verified in the sources checked.", "A"],
  ["Lutheran", "Luᵃ / Luᵇ", "Not verified", "Lu(a+b−) (for Luᵃ); Lu(a−b+) (for Luᵇ)", "Lu(a+b+)", "Bio-Rad 'May show dosage' is blank. Dosage status not verified in the sources checked.", "A"],
  ["Lewis", "Leᵃ / Leᵇ", "Variable", "n/a", "n/a", "Not antithetical alleles, so not genetic dosage. Antigen strength varies between Le(a+) and Le(b+) cells. Bio-Rad 'May show dosage' is blank.", "A, B"],
  ["P1PK", "P1", "Variable", "n/a", "n/a", "Not genetic dosage in the usual sense; P1 strength varies between cells (Bio-Rad remarks: partly inherited and dependent on zygosity of P¹ alleles). Exclusion on any P1+ cell is generally acceptable. Bio-Rad 'May show dosage' is blank.", "A, B, F"],
  ["Xg", "Xgᵃ", "Variable", "Xg(a+) female (may be homozygous)", "Xg(a+) male (hemizygous, single X)", "X-linked: only females can be homozygous. Anti-Xgᵃ is rare; most panels do not report Xgᵃ dosage and any Xg(a+) cell is generally used for exclusion. Bio-Rad 'May show dosage' is blank.", "A, F"],
];
const DOSE_SRC: string[] = [
  "A: Bio-Rad Laboratories, Characteristics of Blood Group Antibodies chart, 'May show dosage' column (section 5.6 on this Page)",
  "B: AABB, Guidelines for Antibody Identification (sample), marketplace.aabb.org/PRODUCTFILES/1735/103001db_sam.pdf",
  "C: StatPearls, Kidd Blood Group System, NCBI Bookshelf NBK613287",
  "D: StatPearls, Duffy Blood Group System, NCBI Bookshelf NBK580473",
  "E: StatPearls, Kell Blood Group System, NCBI Bookshelf NBK609095",
  "F: University of Toronto, LearnSerology: Approach to the Antibody Panel, pie.med.utoronto.ca/learnserology",
  "G: ARUP Laboratories, Introduction to Antibody Identification lecture slides, arup.utah.edu",
];
const DOSE_COL: Record<string, string> = { "Yes": "#0b8a45", "Variable": "#d98a00", "No": "#6b7280", "Not verified": "#9ca3af" };
// Schneck Medical Center blood bank SOP, Ab ID Helpful Hints (transcribed from the sheet). Superseded by the 11/2026 Tech Guide; kept for reference.
const SCH_HINTS: [string, string][] = [
  ["Double dose only", "Use ONLY DOUBLE DOSE (homozygous +/-) expressions to Rule Out Ab. Only 2 needed. Example: C+,c-"],
  ["Single-dose exceptions", "Exceptions when CAN use SINGLE DOSE (heterozygous +/+) expressions: For D, f, K, P1, Xga"],
  ["Anti-D detected", "If Anti-D is detected, you CAN use C+,c+ for C and E+,e+ for E"],
  ["Low-frequency antibodies", "Low Frequency Antibodies may be omitted in the initial ruling out process: V, Cw, Kpa, Jsa, Lua"],
  ["Remaining antibodies", "Continue to exclude any possible remaining antibodies with use of a minimum of 3 Single Dose (Heterozygous +/+) antigen cell reactions"],
  ["Validation", "Must have a minimum of 2 positives and 3 Negatives to validate an antibody"],
  ["Final check", "Once finished with Ab ID, ALWAYS go back and make sure that ALL positive patient results are accounted for. (If do have extra positives, will need to go back and make sure not missing another antibody; like a LFA.)"],
];

// Schneck Blood Bank Tech Guide: Antibody Identification (11/2026), transcribed as written.
const TG1: [string, string][] = [
  [`Review Patient History`, `Verify transfusion and pregnancy history (past 3 months), diagnosis, and past Ab/phenotype records.`],
  [`Evaluate Autocontrol / DAT: Negative`, `Suggests alloantibody.`],
  [`Evaluate Autocontrol / DAT: Positive`, `Indicates possible autoantibody, drug-induced reactivity, or alloantibody on recently transfused donor cells. Perform DAT.`],
];
const TG2: [string, string][] = [
  [`Double-Dose Required (For systems with dosage)`, `Rh: C (C+c-), c (C-c+), E (E+e-), e (E-e+) · Duffy: Fyᵃ (Fy(a+b-)), Fyᵇ (Fy(a-b+)) · Kidd: Jkᵃ (Jk(a+b-)), Jkᵇ (Jk(a-b+)) · MNS: M (M+N-), N (M-N+), S (S+s-), s (S-s+)`],
  [`Single-Dose Permitted`, `D, K, P1, Xgᵃ, Leᵃ, Leᵇ, Luᵃ, Luᵇ. Exception: If Anti-D is present, you may use single-dose C (D- C+ c+) and E (D- E+ e+) to rule out C and E.`],
];
const TG3: [string, string][] = [
  [`Standard "Rule of Three" (p ≤ 0.05)`, `Must have a minimum of 3 antigen-positive reactive cells AND 3 antigen-negative non-reactive cells matching the pattern.`],
  [`"Rule of Two" Exception`, `Minimum of 2 positive/2 negative cells permitted ONLY for low-frequency antibodies (e.g., Cʷ, Kpᵃ) or when using selected cells for complex multi-antibody cases per medical director validation.`],
  [`Account for ALL Reactivity`, `Ensure 100% of positive reactions are explained. If extra positives exist, check for additional antibodies (including LFAs), antibodies to high-prevalence antigens, or dosage effects.`],
];
const TG4: [string, string][] = [
  [`Requirement`, `Patient must type antigen-negative for the suspected corresponding antibody.`],
  [`STOP — Do NOT perform routine serologic phenotyping if:`, `The patient was transfused in the last 3 months (risk of mixed-field reactions). · The patient has a positive IgG DAT (risk of false-positive reactions at the IAT phase).`],
  [`Action`, `In these cases, utilize molecular RBC genotyping or historical pre-transfusion records.`],
];
const TG_APPLY = `How this Page applies it (Schneck rules on): 1 nonreactive cell (0 in every phase entered) crosses out an antigen. Double-dose antigens (C, c, E, e, Fyᵃ, Fyᵇ, Jkᵃ, Jkᵇ, M, N, S, s) need a homozygous cell; single-dose (heterozygous) cells do not count for them. Single-dose antigens (D, K, P₁, Xgᵃ, Leᵃ, Leᵇ, Luᵃ) use any antigen-positive cell. Antigram antigens the guide does not list: k is treated as double dose (1 K−k+ cell), because its partner K is on the antigram; Cʷ and Kpᵃ have no partner on the antigram, so 1 antigen-positive cell, and they are tagged as low-frequency. Luᵇ, V, Jsᵃ and f are not antigram columns. Anti-D detected on: 1 nonreactive D− C+c+ cell rules out C and 1 nonreactive D− E+e+ cell rules out E. Confirmation defaults to the Rule of Three (3+/3−); the Rule of Two option allows 2+/2−.`;
// Blood Type Compatibility Chart (posted chart, Schneck blood bank). [recipient, red cells, whole blood, plasma]
const COMPAT: [string, string, string, string][] = [
  [`O +`, `O +; O -`, `O +; O -`, `any O; A; B or AB`],
  [`O -`, `O -`, `O -`, `any O; A; B or AB`],
  [`A +`, `any A +; A -; O + or O -`, `any A + or A -`, `any A or AB`],
  [`A -`, `any A - or O -`, `A -`, `any A or AB`],
  [`B +`, `any B +; B -; O + or O -`, `any B + or B -`, `any B or AB`],
  [`B -`, `any B - or O -`, `B -`, `any B or AB`],
  [`AB +`, `any AB +; AB -; A +; A -; B +; B -; O +; or O-`, `any AB + or AB -`, `any AB`],
  [`AB -`, `any AB -; A -; B -, or O -`, `AB -`, `AB`],
];
const SELC: [string, string][] = [
  [`Whole Blood`, `Must be identical to that of the recipient.* NA special order`],
  [`Leukoreduced Red Blood Cells`, `Must be compatible with the recipient's plasma.`],
  [`Granulocytes Pheresis`, `Must be compatible with the recipient's plasma. NA special order`],
  [`Fresh Frozen Plasma`, `Should be compatible with the recipient's red cells.`],
  [`Platelets Pheresis`, `All ABO groups acceptable; components compatible with the recipient's red cells preferred`],
  [`Cryoprecipitated AHF`, `All ABO groups Acceptable*`],
];
// Ortho-Clinical Diagnostics Antibody Index Chart (2002). Row: [antibody, ISBT, dots RT|37|AHG|gel RT|gel 37|IgG card 37 (1 = dot), natural, immune, transfusion reaction, HDN, enzyme, % compatible Caucasians, % compatible African-Americans, remarks]. "^" = the remark in the row above continues over this row.
type OR = [string, string, string, string, string, string, string, string, string, string, string];
const ORTHO: [string, OR[]][] = [
  [`Rh-hr`, [
    [`D`, `RH1`, `011011`, `Unlikely`, `Yes`, `Probable`, `Common`, `Increased`, `15`, `8`, `May occur with Anti-C.`],
    [`C`, `RH2`, `011011`, `Unlikely`, `Yes`, `Probable`, `May`, `Increased`, `32`, `73`, `Often found with other antibodies, especially Anit-D or Anti-G.`],
    [`E`, `RH3`, `011011`, `Occasionally`, `Yes`, `Probable`, `May`, `Increased`, `71`, `78`, `Occurs frequently with Anti-c. May be naturally occuring.`],
    [`c`, `RH4`, `011011`, `Unlikely`, `Yes`, `Probable`, `Common`, `Increased`, `20`, `4`, ``],
    [`e`, `RH5`, `011011`, `Unlikely`, `Yes`, `Probable`, `May`, `Increased`, `2`, `2`, ``],
    [`f`, `RH6`, `011011`, `Unlikely`, `Yes`, `Probable`, `May`, `Increased`, `35`, `8`, `Only reacts with compound antigen, ce.`],
    [`Cʷ`, `RH8`, `011011`, `Occasionally`, `Yes`, `Probable`, `May`, `Increased`, `98`, `99`, `May be naturally occuring.`],
    [`V`, `RH10`, `011011`, `Unlikely`, `Yes`, `Probable`, `No Reports`, `Increased`, `99`, `70`, `Often found with other antibodies, especially Anti-D.`],
  ]],
  [`Kell`, [
    [`K`, `KEL1`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `91`, `98`, `Expression of K can be acquired as a result of bacterial activity in vivo and in vitro.`],
    [`k`, `KEL2`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `0.2`, `<0.1`, ``],
    [`Kpᵃ`, `KEL3`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `98`, `>99`, `Kpᵃ may have a supressing effect on other inherited Kell system antigens.`],
    [`Kpᵇ`, `KEL4`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `<0.1`, `<0.1`, `Sera containing Anti-Kpᵇ often contain Anti-K.`],
    [`Jsᵃ`, `KEL6`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `>99`, `80`, ``],
    [`Jsᵇ`, `KEL7`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `<0.1`, `1`, ``],
  ]],
  [`Duffy`, [
    [`Fyᵃ`, `FY1`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Decreased`, `34`, `90`, `Fyᵃ has been demonstrated on fetal RBCs as early as 6 weeks gestation.`],
    [`Fyᵇ`, `FY2`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Decreased`, `17`, `77`, ``],
  ]],
  [`Kidd`, [
    [`Jkᵃ`, `JK1`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Increased`, `23`, `8`, `May exhibit dosage. Anti-Jkᵃ fades in vitro and in vivo.`],
    [`Jkᵇ`, `JK2`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Increased`, `26`, `51`, `Anti-Jkᵇ fades in vitro and in vivo. May cause a severe hemolytic reaction.`],
  ]],
  [`Lewis`, [
    [`Leᵃ`, `LE1`, `111100`, `Yes`, `Unlikely`, `May`, `Unlikely`, `Increased`, `78`, `77`, `Frequently occurs in the serum of pregnant women. Anti-Leᵃ and Anti-Leᵇ are often found together and are most common in people with Le(a-b-) red cells.`],
    [`Leᵇ`, `LE2`, `111100`, `Yes`, `Unlikely`, `Unlikely`, `Unlikely`, `Increased`, `28`, `45`, `^`],
  ]],
  [`MNS`, [
    [`S`, `MNS3`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Variable`, `45`, `69`, `S antigen is sensitive to trace amounts of chlorine.`],
    [`s`, `MNS4`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Variable`, `11`, `7`, `A pH of 6.0 enhances the reactivity of some Anti-s.`],
    [`M`, `MNS1`, `110111`, `Yes`, `Unlikely`, `Unlikely`, `Unlikely`, `Decreased`, `22`, `26`, `Antibody often exhibits dosage. Can be pH dependant.`],
    [`N`, `MNS2`, `110100`, `Yes`, `Unlikely`, `Unlikely`, `Unlikely`, `Decreased`, `28`, `25`, `Formaldehyde induced Anti-N can be found in dialysis patients.`],
    [`U`, `MNS5`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Same`, `<0.1`, `1`, `Most U negative cells are S- s-.`],
  ]],
  [`P`, [
    [`P₁`, `P1`, `110100`, `Yes`, `Unlikely`, `Unlikely`, `Unlikely`, `Increased`, `21`, `6`, `Antigen strength is variable. Anti-P1 is frequently present in serum of patients with Hydatid disease, liver flukes, acute hepatic fascioliasis.`],
  ]],
  [`Globoside`, [
    [`P`, `GLOB1`, `111111`, `Yes`, `Unlikely`, `Probable`, `No Reports`, `Increased`, `<0.1`, `<0.1`, `Associated with Paroxysmal Cold Hemoglobinuria (PCH).`],
    [`P+P₁+Pᵏ`, `GLOB1/P1/GLOB2`, `111111`, `Yes`, `Unlikely`, `Probable`, `May`, `Increased`, `<0.1`, `<0.1`, `Alloantibody in the sera of p-persons. May cause complete hemolysis in fresh serum. Associated with higher than normal rates of spontaneous abortions.`],
  ]],
  [`Lutheran`, [
    [`Luᵃ`, `LU1`, `110000`, `Yes`, `Yes`, `Unlikely`, `Unlikely`, `Variable`, `92`, `95`, `Sera containing Anti-Luᵃ often also contains HLA antibodies.`],
    [`Luᵇ`, `LU2`, `001001`, `Unlikely`, `Yes`, `Probable`, `May`, `Variable`, `<0.2`, `<0.2`, ``],
  ]],
  [`HTLA`, [
    [`Ykᵃ`, `KN5`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Decreased`, `8`, `2`, `Antigens can vary in strength. The antibodies can be difficult to dectect due to characteristically weak reactions in the antiglobulin test. This can lead to variable results in tests on different samples from the same patient.`],
    [`Knᵃ`, `KN1`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Same`, `1`, `1`, `^`],
    [`Csᵃ`, `COST1`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Same`, `2`, `1`, `^`],
    [`Chᵃ`, `CH/RG1`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Decreased`, `4`, `4`, `^`],
    [`Rgᵃ`, `CH/RG11`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Decreased`, `2`, `2`, `^`],
    [`JMH`, `JMH`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Decreased`, `4`, `4`, `^`],
    [`McCᵃ`, `KN3`, `001000`, `Unlikely`, `Yes`, `Unlikely`, `Unlikely`, `Same`, `2`, `6`, `^`],
  ]],
];
const OR_DOT: string[] = ["#1d3f73", "#2a86c4", "#e0607e", "#1d3f73", "#2a86c4", "#e0607e"];
const OR_PH: string[] = ["RT", "37°C", "AHG", "Buffered Gel Card RT", "Buffered Gel Card 37°C", "IgG Card 37°C"];
const spanOf = (rows: string[][], j: number, col: number): number => { let n = 1; while (j + n < rows.length && rows[j + n][col] === "^") n++; return n; };
// Grifols "Human Blood Group Antigens & Antibodies" poster, right half (left half in GRIF_L below). Grouped by Gene(s). Row: [ISBT symbol, Caucasian, Black, Asian, antigen density, Ig class, 4°C-RT, IAT, Papain/Ficin, DTT 0.2M, HTR, HDFN]. "·" = dot printed on the poster.
type GR = [string, string, string, string, string, string, string, string, string, string, string, string];
const GRIF: [string, GR[]][] = [
  [`ABO`, [
    [`ABO1`, `43`, `27`, `28`, `Variable`, `IgM; (IgG)`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No-Severe`, `No-Moderate`],
    [`ABO2`, `9`, `20`, `27`, `Variable`, `IgM; (IgG)`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No-Severe`, `No-Moderate`],
    [`ABO3`, `56`, `51`, `57`, `Variable`, `IgM; (IgG)`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No-Mild`, `No-Moderate`],
    [`ABO4`, `34`, `19`, `27`, `Variable`, `IgM; (IgG)`, `Yes`, `Rarely`, `Enhanced`, `Resistant`, `No-Mild`, `No`],
  ]],
  [`GYPA`, [
    [`MNS1`, `78`, `74`, `·`, `Dosage`, `IgG (cold); IgM`, `Yes`, `Rarely`, `Sensitive*`, `Resistant`, `Rare`, `Rare`],
    [`MNS2`, `72`, `75`, `·`, `Dosage`, `IgG (cold); IgM`, `Yes`, `Rarely`, `Sensitive*`, `Resistant`, `Rare`, `No`],
  ]],
  [`GYPB`, [
    [`MNS3`, `55`, `31`, `·`, `Dosage`, `IgG; IgM`, `Yes`, `Yes`, `Variable**`, `Resistant`, `No-Mod.(Rare)`, `No-Mod.(Rare)`],
    [`MNS4`, `89`, `93`, `·`, `Dosage`, `IgG; IgM`, `Yes`, `Yes`, `Variable**`, `Resistant`, `No-Mild(Rare)`, `No-Severe(Rare)`],
    [`MNS5`, `99,9`, `99`, `·`, `·`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `Mild-Severe`, `Mild-Severe`],
  ]],
  [`GYPA-B (Hybrid)`, [
    [`MNS7`, `<0.01`, `<0.01`, `~15`, `·`, `IgM; IgG`, `Yes`, `Yes`, `Sensitive`, `Resistant`, `Rare`, `Mild-Severe`],
    [`MNS10`, `<0.01`, `<0.01`, `6-9`, `·`, `IgG; (IgM)`, `Yes`, `Yes`, `Sensitive`, `Resistant`, `No-Severe`, `No-Severe`],
  ]],
  [`A4GALT`, [
    [`P1PK1`, `79`, `94`, `20-30`, `Variable`, `IgM; (IgG)`, `Yes`, `Rarely`, `Enhanced`, `Resistant`, `No-Moderate`, `No`],
    [`P1PK3`, `100`, `100`, `100`, `Variable`, `IgM; IgG`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No-Severe`, `No-Severe`],
  ]],
  [`RHD`, [
    [`RH1`, `85`, `92`, `99`, `Variable`, `IgG; (IgM)`, `Rarely`, `Yes`, `Enhanced`, `Resistant`, `Mild-Severe`, `Mild-Severe`],
  ]],
  [`RHCE`, [
    [`RH2`, `68`, `27`, `93`, `Dosage`, `IgG; IgM`, `Rarely`, `Yes`, `Enhanced`, `Resistant`, `Mild-Severe`, `Mild-Severe`],
    [`RH3`, `29`, `22`, `39`, `Dosage`, `IgG; IgM`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `Mild-Moderate`, `Mild`],
    [`RH4`, `80`, `98`, `47`, `Dosage`, `IgG; (IgM)`, `Rarely`, `Yes`, `Enhanced`, `Resistant`, `Mild-Severe`, `Mild-Severe`],
    [`RH5`, `98`, `98`, `96`, `Dosage`, `IgG; (IgM)`, `Rarely`, `Yes`, `Enhanced`, `Resistant`, `Mild-Moderate`, `Rare(Mild)`],
    [`RH6`, `65`, `92`, `12`, `·`, `IgG; (IgM)`, `Yes`, `Yes`, `Resistant`, `Resistant`, `Mild`, `Mild`],
    [`RH7`, `68`, `27`, `92`, `·`, `IgG; (IgM)`, `Rarely`, `Yes`, `Enhanced`, `Resistant`, `Mild`, `Mild`],
    [`RH8`, `2`, `1`, `·`, `·`, `IgG; IgM`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `Mild-Severe`, `Mild-Moderate`],
    [`RH10`, `1`, `30`, `·`, `·`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `Mild`, `No`],
    [`RH12`, `84`, `92`, `100`, `·`, `IgG`, `·`, `Yes`, `Enhanced`, `Resistant`, `No-Severe`, `No-Severe`],
    [`RH19`, `98`, `97`, `98`, `·`, `IgG`, `·`, `Yes`, `Enhanced`, `Resistant`, `No-Fatal`, `No Evidence`],
    [`RH20`, `<0.01`, `26-40`, `<0.01`, `·`, `IgG`, `·`, `Yes`, `Enhanced`, `Resistant`, `Mild`, `No/+DAT`],
    [`RH31`, `98`, `97`, `96`, `·`, `IgG`, `·`, `Yes`, `Enhanced`, `Resistant`, `No`, `No/+DAT`],
  ]],
  [`LU, BCAM`, [
    [`LU1`, `8`, `5`, `·`, `Variable`, `IgM; IgG`, `Yes`, `Yes`, `Resistant`, `Sensitive`, `No`, `No-Mild (Rare)`],
    [`LU2`, `99.8`, `99,8`, `99,8`, `Variable`, `IgG; IgM`, `Yes`, `Yes`, `Resistant`, `Sensitive`, `Mild-Moderate`, `Mild`],
    [`LU3`, `>99`, `>99`, `>99`, `·`, `IgG`, `Yes`, `Yes`, `Resistant`, `Sensitive`, `No Data`, `No Data`],
  ]],
  [`KEL`, [
    [`KEL1`, `9`, `2`, `Rare`, `·`, `IgG; (IgM)`, `Rarely`, `Yes`, `Resistant††`, `Sensitive`, `Mild-Severe`, `Mild-Severe`],
    [`KEL2`, `98.8`, `100`, `·`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Resistant††`, `Sensitive`, `Mild-Moderate`, `Mild-Severe`],
    [`KEL3`, `2`, `<0.01`, `·`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Resistant††`, `Sensitive`, `Mild-Moderate`, `Mild-Severe`],
    [`KEL4`, `99.9`, `100`, `100`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Resistant††`, `Sensitive`, `No-Moderate`, `Mild-Moderate`],
    [`KEL6`, `<0.01`, `20`, `·`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Resistant††`, `Sensitive`, `No-Moderate`, `Mild-Severe`],
    [`KEL7`, `>99`, `99`, `·`, `·`, `IgG`, `·`, `Yes`, `Resistant††`, `Sensitive`, `Mild-Moderate`, `Mild-Severe`],
  ]],
  [`FUT3`, [
    [`LE1`, `22`, `23`, `·`, `Variable`, `IgM; (IgG)`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No/Rare Hemolytic`, `No-Mild`],
    [`LE2`, `72`, `55`, `·`, `Variable`, `IgM; (IgG)`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No`, `No-Mild`],
  ]],
  [`FY, DARC`, [
    [`FY1`, `66`, `10`, `99`, `Dosage`, `IgG; (IgM)`, `·`, `Yes`, `Sensitive***`, `Resistant`, `Mild-Severe/Delayed`, `Mild-Moderate`],
    [`FY2`, `83`, `23`, `18.5`, `Dosage`, `IgG; (IgM)`, `·`, `Yes`, `Sensitive***`, `Resistant`, `Mild-Severe/Delayed`, `Mild`],
    [`FY3`, `>99.9`, `32`, `99.9`, `·`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `Mild-Mod./Delayed`, `Mild`],
  ]],
  [`JK, SLC14A1`, [
    [`JK1`, `77`, `92`, `72`, `Dosage`, `IgG; IgGM;IgG+IgM`, `·`, `Yes`, `Enhanced`, `Resistant`, `No-Severe/Delayed`, `Mild-Moderate`],
    [`JK2`, `74`, `49`, `76`, `Dosage`, `IgG; IgG+IgM; IgM`, `·`, `Yes`, `Enhanced`, `Resistant`, `No-Severe/Delayed`, `No-Mild`],
    [`JK3`, `100`, `·`, `·`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Enhanced`, `Resistant`, `No-Severe/Delayed`, `No-Mild`],
  ]],
  [`DI, SLC4A1`, [
    [`DI1`, `0,01`, `0,01`, `·`, `Dosage`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Severe`, `Mild-Severe`],
    [`DI2`, `100`, `·`, `·`, `Dosage`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Moderate`, `Mild`],
    [`DI3`, `<0.01`, `·`, `·`, `·`, `IgM; IgG`, `Yes`, `Yes`, `Resistant`, `Resistant`, `No-Severe`, `Mild-Severe`],
  ]],
  [`YT, ACHE`, [
    [`YT1`, `>99.8`, `>99.8`, `·`, `·`, `IgG (IgG4)`, `·`, `Yes`, `Variable`, `Sensitive`, `No-Moderate`, `No`],
    [`YT2`, `8`, `·`, `·`, `·`, `IgG`, `·`, `Yes`, `Variable`, `Sensitive`, `No`, `No`],
  ]],
  [`XG, MIC2`, [
    [`XG1`, `F- 89 / M- 66`, `·`, `·`, `Variable`, `IgG;(IgM)`, `·`, `Yes`, `Sensitive`, `Resistant`, `No`, `No`],
  ]],
  [`DO, ART4`, [
    [`DO1`, `67`, `55`, `·`, `·`, `IgG`, `·`, `Yes`, `Enhanced****`, `Sensitive`, `Delayed-Hemolytic`, `No/+DAT`],
    [`DO2`, `82`, `89`, `·`, `·`, `IgG`, `·`, `Yes`, `Enhanced****`, `Sensitive`, `Acute, Delayed`, `No/+DAT`],
    [`DO3`, `100`, `100`, `>99.9`, `·`, `IgG`, `·`, `Yes`, `Enhanced****`, `Sensitive`, `No-Moderate`, `No/+DAT`],
    [`DO4`, `100`, `>99`, `100`, `·`, `IgG`, `·`, `Yes`, `Enhanced****`, `Sensitive`, `No-Moderate`, `No/+DAT`],
    [`DO5`, `100`, `>99`, `100`, `·`, `IgG`, `·`, `Yes`, `Enhanced****`, `Variable`, `No-Moderate`, `No`],
  ]],
  [`CO, AQP1`, [
    [`CO1`, `99,5`, `99,5`, `99,5`, `·`, `IgG; (IgM)`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Moderate`, `Mild-Severe`],
    [`CO2`, `10`, `10`, `10`, `·`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Moderate`, `Mild`],
  ]],
  [`C4B`, [[`CH/RG1`, `96`, `·`, `·`, `Variable`, `IgG (IgG2; IgG4)`, `·`, `Yes`, `Sensitve (sic)`, `Resistant`, `No`, `No`]]],
  [`C4A`, [[`CH/RG11`, `>98`, `>98`, `>98`, `Variable`, `IgG`, `·`, `Yes`, `Sensitive`, `Resistant`, `No`, `No`]]],
  [`FUT1`, [[`H1`, `99,9`, `99,9`, `99,9`, `Variable`, `IgM; (IgG)`, `Yes`, `·`, `Enhanced`, `Resistant`, `No-Severe`, `No`]]],
  [`GE, GYPC`, [
    [`GE2`, `>99.9`, `>99.9`, `>99.9`, `·`, `IgG`, `·`, `Yes`, `Sensitive`, `Variable`, `No-Moderate`, `No/+DAT`],
    [`GE3`, `>99.9`, `>99.9`, `>99.9`, `·`, `IgG; IgM`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Moderate`, `+DAT/Severe`],
    [`GE4`, `>99.9`, `>99.9`, `>99.9`, `·`, `IgG`, `·`, `Yes`, `Sensitive`, `Resistant`, `No Data`, `No Data`],
  ]],
  [`KN, CR1`, [[`KN1`, `98`, `99`, `·`, `Variable`, `IgG`, `·`, `Yes`, `Resistant*****`, `Sensitive`, `No`, `No`]]],
  [`JMH, SEMA7A`, [[`JMH1`, `94,5`, `99,9`, `·`, `Variable`, `IgG`, `·`, `Yes`, `Sensitive`, `Sensitive`, `No`, `No`]]],
  [`GCNT2`, [[`I1`, `>99`, `>99`, `>99`, `Variable`, `IgM; (IgG)`, `Yes`, `·`, `Enhanced`, `Resistant`, `No`, `No`]]],
  [`B3GALNT1`, [[`GLOB1`, `>99.9`, `>99.9`, `>99.9`, `Variable`, `IgM; IgG`, `Yes`, `Yes`, `Enhanced`, `Resistant`, `No-Severe`, `No-Mild`]]],
  [`LAN, ABCB6`, [[`LAN`, `>99`, `>99`, `>99`, `Variable`, `IgG`, `·`, `Yes`, `Resistant`, `Resistant`, `No-Severe /Hemolytic`, `No-Mild`]]],
  [`SMIM1`, [[`VEL`, `>99`, `>99`, `>99`, `Variable`, `IgM with IgG`, `·`, `Yes`, `Enhanced`, `Variable`, `No-Severe /Hemolytic`, `+DAT/Severe`]]],
];
// Grifols poster, left half (Blood Group System and Antigen), keyed by ISBT symbol. Transcribed by Alexis from the poster photos, 11/19/2026.
const GRIF_L: Record<string, [string, string]> = {
  "ABO1": [`ABO 001`, `A`], "ABO2": [`ABO 001`, `B`], "ABO3": [`ABO 001`, `A,B`], "ABO4": [`ABO 001`, `A₁`],
  "MNS1": [`MNS 002`, `M`], "MNS2": [`MNS 002`, `N`], "MNS3": [`MNS 002`, `S`], "MNS4": [`MNS 002`, `s`], "MNS5": [`MNS 002`, `U`], "MNS7": [`MNS 002`, `Miᵃ`], "MNS10": [`MNS 002`, `Mur`],
  "P1PK1": [`P1PK 003`, `P₁`], "P1PK3": [`P1PK 003`, `Pᵏ`],
  "RH1": [`Rh 004`, `D`], "RH2": [`Rh 004`, `C`], "RH3": [`Rh 004`, `E`], "RH4": [`Rh 004`, `c`], "RH5": [`Rh 004`, `e`], "RH6": [`Rh 004`, `f`], "RH7": [`Rh 004`, `Ce`], "RH8": [`Rh 004`, `Cʷ`], "RH10": [`Rh 004`, `V`], "RH12": [`Rh 004`, `G`], "RH19": [`Rh 004`, `hrˢ`], "RH20": [`Rh 004`, `VS`], "RH31": [`Rh 004`, `hrᴮ`],
  "LU1": [`Lutheran 005`, `Luᵃ`], "LU2": [`Lutheran 005`, `Luᵇ`], "LU3": [`Lutheran 005`, `Lu3`],
  "KEL1": [`Kell 006`, `K`], "KEL2": [`Kell 006`, `k`], "KEL3": [`Kell 006`, `Kpᵃ`], "KEL4": [`Kell 006`, `Kpᵇ`], "KEL6": [`Kell 006`, `Jsᵃ`], "KEL7": [`Kell 006`, `Jsᵇ`],
  "LE1": [`Lewis 007`, `Leᵃ`], "LE2": [`Lewis 007`, `Leᵇ`],
  "FY1": [`Duffy 008`, `Fyᵃ`], "FY2": [`Duffy 008`, `Fyᵇ`], "FY3": [`Duffy 008`, `Fy3`],
  "JK1": [`Kidd 009`, `Jkᵃ`], "JK2": [`Kidd 009`, `Jkᵇ`], "JK3": [`Kidd 009`, `Jk3`],
  "DI1": [`Diego 010`, `Diᵃ`], "DI2": [`Diego 010`, `Diᵇ`], "DI3": [`Diego 010`, `Wrᵃ`],
  "YT1": [`Yt 011`, `Ytᵃ`], "YT2": [`Yt 011`, `Ytᵇ`],
  "XG1": [`Xg 012`, `Xgᵃ`],
  "DO1": [`Dombrock 014`, `Doᵃ`], "DO2": [`Dombrock 014`, `Doᵇ`], "DO3": [`Dombrock 014`, `Gyᵃ`], "DO4": [`Dombrock 014`, `Hy`], "DO5": [`Dombrock 014`, `Joᵃ`],
  "CO1": [`Colton 015`, `Coᵃ`], "CO2": [`Colton 015`, `Coᵇ`],
  "CH/RG1": [`Chido/Rodgers 017`, `Ch1`], "CH/RG11": [`Chido/Rodgers 017`, `Rg1`],
  "H1": [`H 018`, `H`],
  "GE2": [`Gerbich 020`, `Ge2`], "GE3": [`Gerbich 020`, `Ge3`], "GE4": [`Gerbich 020`, `Ge4`],
  "KN1": [`Knops 022`, `Knᵃ`],
  "JMH1": [`John Milton Hagen 026`, `JMH`],
  "I1": [`I 027`, `I`],
  "GLOB1": [`Globoside 028`, `P`],
  "LAN": [`Lan 033`, `Lan`],
  "VEL": [`Vel 034`, `Vel`],
};
const GRIF_KEYS: string[] = GRIF.flatMap(([, rows]: [string, GR[]]) => rows.map((r: GR) => r[0]));
const GRIF_SYS = (k: string): string => (GRIF_L[k] ? GRIF_L[k][0] : "");
const GRIF_SPAN: Record<string, number> = {};
GRIF_KEYS.forEach((k: string, i: number) => { if (i === 0 || GRIF_SYS(GRIF_KEYS[i - 1]) !== GRIF_SYS(k)) { let n = 1; while (i + n < GRIF_KEYS.length && GRIF_SYS(GRIF_KEYS[i + n]) === GRIF_SYS(k)) n++; GRIF_SPAN[k] = n; } });
const GRIF_FOOT: string[] = [
  `† The enzyme & DTT information provided is to be used only as a guide because with all chemical treatment of RBCs, the effect varies depending on the exact conditions of treatment, purity of reagents and the age (condition) of the RBC's.`,
  `†† Most Kell blood group system antigens are sensitive to treatment with a mixture of trypsin and α-chymotrypsin.`,
  `* M,N: α-Chymotrypsin resistant`,
  `** S,s: α-Chymotrypsin Sensitive`,
  `*** Fyᵃ, Fyᵇ: Trypsin resistant (Fyᵇ weakened) (as read: the letter in the parentheses is hard to read on the poster)`,
  `**** Dombrock system is sensitive to Trypsin`,
  `***** Knᵃ: Papain resistant, ficin sensitive`,
];
const GRIF_REFS: string[] = [
  `Daniels G, Poole J, de Silva M, Callaghan T, MacLennan S, Smith N. "The clinical significance of blood group antibodies". Transfusion Medicine, Vol 12(5), 287-2952, 2002.`,
  `Reid M, Lomas-Francis C "Blood Group Antigens & Antibodies: A Guide to Clinical Relevance & Technical Tips". Starbright Books, 2007.`,
  `Daniels G, Bromilow I. "Essential Guide to Blood Groups". Wiley-Blackwell, 2nd Edition, 2010.`,
  `Roback JD. "Technical manual". American Association of Blood Banks, 17th Edition, 2011.`,
  `Reid ME, Lomas-Francis C, Olson ML. "The Blood Group Antigen FactsBook". Academic Press, 3rd Edition, 2012.`,
  `Storry JR, Joud M, Christophersen MK, Thuresson B, Akerstrom B, Sojka BN, Nilsson B, Olsson ML. "Homozygosity for a null allele of SMIM1 defines the Vel-negative blood group phenotype". Nature Genetics. Vol 45(5), 537-541, 2013.`,
];
// Schneck blood bank posted sheet "Selection of units (substitution list)". [recipient, donor O, donor A, donor B, donor AB]; "" = not listed.
const CRYO: [string, string, string, string, string][] = [
  [`O`, `Y`, `Y`, `Y`, `Y`],
  [`A`, `Also Compatible`, `Y`, `Also compatible`, `Y`],
  [`B`, `Also Compatible`, `Also compatible`, `Y`, `Y`],
  [`AB`, `Also Compatible`, `Also Compatible`, `Also Compatible`, `Y`],
];
const PLASMA: [string, string, string, string, string][] = [
  [`O`, `Y`, `Y`, `Y`, `Y`],
  [`A`, ``, `Y`, ``, `Y`],
  [`B`, ``, ``, `Y`, `Y`],
  [`AB`, ``, ``, ``, `Y`],
];
const GR_BG: string[] = ["", "rgba(110,180,200,0.20)", "rgba(110,180,200,0.20)", "rgba(110,180,200,0.20)", "rgba(235,225,190,0.25)", "rgba(180,110,170,0.18)", "rgba(200,150,190,0.14)", "rgba(200,150,190,0.14)", "rgba(200,150,190,0.14)", "rgba(200,150,190,0.14)", "rgba(120,90,170,0.22)", "rgba(150,120,190,0.14)"];

const BOLD_START = [9, 13, 21];
const BOLD_END = [10, 16, 21];
const BOLD_COLS = [9, 10, 13, 14, 15, 16, 21];
// Antigen-positive % (W = White/Caucasian, B = Black). Ag-neg = 100 - pos. null = not verified.
const FREQ: Record<string, { sys: string; w: string; b: string | null; wn: string; bn: string | null; src: string }> = {
  D: { sys: "Rh", w: "85", b: "92", wn: "15", bn: "8", src: "1" },
  C: { sys: "Rh", w: "68", b: "27", wn: "32", bn: "73", src: "1" },
  E: { sys: "Rh", w: "29", b: "22", wn: "71", bn: "78", src: "1" },
  c: { sys: "Rh", w: "80", b: "96", wn: "20", bn: "4", src: "1" },
  e: { sys: "Rh", w: "98", b: "98", wn: "2", bn: "2", src: "1" },
  K: { sys: "Kell", w: "9", b: "2", wn: "91", bn: "98", src: "2, 6" },
  k: { sys: "Kell", w: "99.8", b: "100", wn: "0.2", bn: "0", src: "6 (2: ~100%)" },
  Kpa: { sys: "Kell", w: "2", b: "<0.01", wn: "98", bn: ">99.99", src: "6 (2: ~2%)" },
  Fya: { sys: "Duffy", w: "66", b: "10", wn: "34", bn: "90", src: "3" },
  Fyb: { sys: "Duffy", w: "83", b: "23", wn: "17", bn: "77", src: "3" },
  Jka: { sys: "Kidd", w: "77", b: "92", wn: "23", bn: "8", src: "4, 8" },
  Jkb: { sys: "Kidd", w: "74", b: "49", wn: "26", bn: "51", src: "4, 8" },
  M: { sys: "MNS", w: "78", b: "74", wn: "22", bn: "26", src: "5, 8" },
  N: { sys: "MNS", w: "72", b: "75", wn: "28", bn: "25", src: "5, 8" },
  S: { sys: "MNS", w: "55", b: "31", wn: "45", bn: "69", src: "5, 8" },
  s: { sys: "MNS", w: "89", b: "93", wn: "11", bn: "7", src: "5, 8" },
  Lea: { sys: "Lewis", w: "22", b: "23", wn: "78", bn: "77", src: "7, 8" },
  Leb: { sys: "Lewis", w: "72", b: "55", wn: "28", bn: "45", src: "7, 8" },
  P1: { sys: "P1PK", w: "79", b: "94", wn: "21", bn: "6", src: "8" },
  Lua: { sys: "Lutheran", w: "8", b: "5", wn: "92", bn: "95", src: "8" },
  Xga: { sys: "Xg", w: "89 F / 66 M", b: null, wn: "11 F / 34 M", bn: null, src: "9" },
};
const SOURCES: string[] = [
  "1. Dean L. Blood Groups and Red Cell Antigens (NCBI), Rh: https://www.ncbi.nlm.nih.gov/books/NBK2269/",
  "2. Dean, Kell: https://www.ncbi.nlm.nih.gov/books/NBK2270/",
  "3. Dean, Duffy: https://www.ncbi.nlm.nih.gov/books/NBK2271/",
  "4. Dean, Kidd: https://www.ncbi.nlm.nih.gov/books/NBK2272/",
  "5. Dean, MNS: https://www.ncbi.nlm.nih.gov/books/NBK2274/",
  "6. ScienceDirect Topics, Kell antigen system: https://www.sciencedirect.com/topics/biochemistry-genetics-and-molecular-biology/kell-antigen-system",
  "7. ScienceDirect Topics, Lewis system: https://www.sciencedirect.com/topics/medicine-and-dentistry/blood-group-lewis-system",
  "8. Owaidah et al. 2020, Table (Caucasian/African reference columns): https://pmc.ncbi.nlm.nih.gov/articles/PMC7025674/",
  "9. Whole-genome Xga study (Northern European, by sex): https://pmc.ncbi.nlm.nih.gov/articles/PMC6402986/",
];
const pct = (s: string): string => s.replace(/(\d+(?:\.\d+)?)/g, "$1%");
const negTxt = (ag: string): string => { const f = FREQ[ag]; if (!f) return ""; return f.bn === null ? ` — ${pct(f.wn)} of White donors ${LABEL[ag]}−` : ` — ${pct(f.wn)} of White, ${pct(f.bn)} of Black donors ${LABEL[ag]}−`; };
const CLIN: Record<string, [string, boolean]> = {
  D: ["Significant: HTR, HDFN", true], C: ["Significant: HTR, HDFN", true], E: ["Significant: HTR, HDFN", true], c: ["Significant: HTR, severe HDFN", true], e: ["Significant: HTR, HDFN", true],
  K: ["Significant: HTR, severe HDFN", true], k: ["Significant: HTR, HDFN", true], Kpa: ["Significant: HTR, HDFN", true],
  Fya: ["Significant: HTR, HDFN", true], Fyb: ["Significant: HTR, HDFN", true], Jka: ["Significant: delayed HTR (often severe), HDFN usually mild", true], Jkb: ["Significant: delayed HTR (often severe), HDFN usually mild", true],
  S: ["Significant: HTR, HDFN", true], s: ["Significant: HTR, HDFN", true],
  M: ["Usually not significant; sometimes significant if reactive at 37°C or AHG", false], N: ["Usually not significant", false],
  Lea: ["Usually not significant; rarely HTR if reactive at 37°C", false], Leb: ["Usually not significant", false],
  P1: ["Usually not significant; rarely HTR if reactive at 37°C", false], Lua: ["Usually not significant; mild HDFN only", false], Xga: ["Not significant", false],
};
const PINK = "rgba(224, 48, 30, 0.13)";
const SIG_EXTRA: string[][] = [
  ["Kpᵇ (Kp(b−))", "<0.1%", "not verified", "D"],
  ["Jsᵃ (Js(a−))", "99.99%", "80%", "A"],
];
const NONSIG_EXTRA: string[][] = [
  ["Ch (Chido, Ch−)", "3.8%", "not verified", "D", "HTLA-type, not significant"],
  ["Rg (Rodgers, Rg−)", "2%", "not verified", "D", "HTLA-type, not significant"],
  ["Knᵃ (Knops, Kn(a−))", "1%", "not verified", "D", "HTLA-type, not significant"],
  ["Csᵃ, JMH, Bg", "not verified", "not verified", "–", "HTLA-type / Bg (HLA); not significant"],
];
const PHENO: string[][] = [
  ["ABO", "O", "45%", "49%", "B"], ["ABO", "A", "40%", "27%", "B"], ["ABO", "B", "11%", "20%", "B"], ["ABO", "AB", "4%", "4%", "B"],
  ["Rh", "DCe/DCe (R₁R₁)", "17.6%", "2.9%", "C"], ["Rh", "DCe/dce (R₁r)", "31.1%", "8.8%", "C"], ["Rh", "DCe/DcE (R₁R₂)", "11.8%", "3.7%", "C"], ["Rh", "DcE/DcE (R₂R₂)", "2%", "1.3%", "C"], ["Rh", "DcE/dce (R₂r)", "10.4%", "5.7%", "C"], ["Rh", "Dce/dce (R₀r)", "3%", "22.9%", "C"], ["Rh", "dce/dce (rr)", "15%", "7%", "C"], ["Rh", "dCe/dce (r′r)", "1%", "1%", "C"], ["Rh", "dce/dcE (r″r)", "1%", "rare", "C"],
  ["Kell", "K−k+", "91%", "98%", "A"], ["Kell", "K+k+", "8.8%", "2%", "A"], ["Kell", "K+k−", "0.2%", "rare", "A"], ["Kell", "Kp(a−b+)", "97.7%", "100%", "A"], ["Kell", "Js(a−b+)", "100%", "80%", "A"],
  ["Duffy", "Fy(a+b−)", "17%", "9%", "A"], ["Duffy", "Fy(a+b+)", "49%", "1%", "A"], ["Duffy", "Fy(a−b+)", "34%", "22%", "A"], ["Duffy", "Fy(a−b−)", "very rare", "68%", "A"],
  ["Kidd", "Jk(a+b−)", "26%", "51%", "A"], ["Kidd", "Jk(a+b+)", "50%", "41%", "A"], ["Kidd", "Jk(a−b+)", "23%", "8%", "A"], ["Kidd", "Jk(a−b−)", "rare", "rare", "A"],
  ["MNS", "M+N−", "28%", "25%", "B"], ["MNS", "M+N+", "50%", "49%", "B"], ["MNS", "M−N+", "22%", "26%", "B"], ["MNS", "S+s−", "11%", "7%", "B"], ["MNS", "S+s+", "44%", "24%", "B"], ["MNS", "S−s+", "45%", "69%", "B"], ["MNS", "S−s−U−", "not verified (rare)", "not verified", "–"],
  ["Lewis", "Le(a+b−)", "27%", "23%", "B"], ["Lewis", "Le(a−b+)", "72%", "55%", "B"], ["Lewis", "Le(a−b−)", "6%", "22%", "B"],
  ["P1PK", "P₁+", "79%", "94%", "B"], ["P1PK", "P₁− (P₂)", "21%", "6%", "B"],
  ["Lutheran", "Lu(a+b−)", "0.2%", "not verified", "D"], ["Lutheran", "Lu(a+b+)", "7.5%", "not verified", "D"], ["Lutheran", "Lu(a−b+)", "92.3%", "not verified", "D"],
];
const ABFREQ: string[][] = [
  ["1", "anti-E", "18.7%"], ["2", "anti-K", "17.3%"], ["3", "anti-D", "16.4%"], ["4", "anti-M", "9.4%"], ["5", "anti-Fyᵃ", "6.9%"], ["6", "anti-C", "6.1%"], ["7", "anti-Kpᵃ", "4.7%"], ["8", "anti-Jkᵃ", "4.3%"], ["9", "anti-c", "4.1%"],
];
const SRC2: string[] = [
  "A. Dean, Blood Groups and Red Cell Antigens (NCBI Bookshelf), Kell, Duffy and Kidd chapters: https://www.ncbi.nlm.nih.gov/books/NBK2270/ , https://www.ncbi.nlm.nih.gov/books/NBK2271/ , https://www.ncbi.nlm.nih.gov/books/NBK2272/",
  "B. Phenotype table, Whites and Blacks columns (ABO, Lewis, P1, MNS, Duffy): https://pmc.ncbi.nlm.nih.gov/articles/PMC4475644/",
  "C. Rh phenotypes, Whites and African Blacks columns, Table 6: https://pmc.ncbi.nlm.nih.gov/articles/PMC3862596/",
  "D. Australian Red Cross Lifeblood donor phenotypes (mostly White donors): https://www.lifeblood.com.au/health-professionals/testing/blood-groups/phenotypes",
  "E. 1,815 alloantibodies in 1,575 patients, Auvergne-Loire French Blood Establishment: https://pubmed.ncbi.nlm.nih.gov/23159062/",
];
const isReactive = (g: string): boolean => g !== "" && g !== "0" && g !== "nt";
const NS = 2; // screen cells shown above the panel cells
const NP = 13; // first supplemental (expired) panel row
const NR = 24;
const EXPIRED_IDX: number[] = LOTS.map((l: Lot, i: number) => (l.exp < TODAY ? i : -1)).filter((i: number) => i >= 0);
const blank = (): string[] => Array.from({ length: NR }, () => "");
const zeros = (): string[] => Array.from({ length: NR }, () => "0");
const num = (s: string | null): number | null => { if (s === null) return null; if (!/^[<>]?\d+(\.\d+)?$/.test(s)) return null; return parseFloat(s.replace(/[<>]/g, "")); };
const cellName = (scr: boolean, i: number): string => (scr ? (i === 0 ? "I" : "II") : String(i + 1));

export default function App() {
  const t = useGrokTheme();
  const [pLot, setPLot] = useState<string>("0");
  const [sLot, setSLot] = useState<string>("0");
  const [calcSel, setCalcSel] = useState<string[]>([]);
  const [calcAuto, setCalcAuto] = useState<boolean>(true);
  const [xOn, setXOn] = useState<boolean>(false);
  const [xLot, setXLot] = useState<string>(String(EXPIRED_IDX[0] ?? 0));
  const [pop, setPop] = useState<string>("u");
  const [need, setNeed] = useState<number>(2);
  const [rx, setRx] = useState<string[]>(zeros());
  const [rIS, setRIS] = useState<string[]>(blank());
  const [r37, setR37] = useState<string[]>(blank());
  const [ac, setAc] = useState<string>("0");
  const [acIS, setAcIS] = useState<string>("");
  const [ac37, setAc37] = useState<string>("");
  const [het, setHet] = useState<boolean>(false);
  const [schneck, setSchneck] = useState<boolean>(true);
  const [antiD, setAntiD] = useState<boolean>(false);
  const [inclSC, setInclSC] = useState<boolean>(true);
  const [rule2, setRule2] = useState<boolean>(false);
  const [txRecent, setTxRecent] = useState<boolean>(false);
  const [datPos, setDatPos] = useState<boolean>(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [example, setExample] = useState<boolean>(false);
  const [brand, setBrand] = useState<string>(BRANDS[0]);
  const [xOut, setXOut] = useState<boolean>(true);
  const [hlPos, setHlPos] = useState<boolean>(true);
  const [hlNeg, setHlNeg] = useState<boolean>(false);
  const PL = LOTS[Math.min(Number(pLot), LOTS.length - 1)];
  const SL = SCREENS[Math.min(Number(sLot), SCREENS.length - 1)];
  const XL = LOTS[Math.min(Number(xLot), LOTS.length - 1)];
  const XS: Lot[] = xOn ? [XL] : [];
  const L: Lot = { lot: `${SL.lot} + ${PL.lot}`, exp: SL.exp < PL.exp ? SL.exp : PL.exp, donors: [...SL.donors, ...PL.donors, ...XS.flatMap((x: Lot) => x.donors)], rh: [...SL.rh, ...PL.rh, ...XS.flatMap((x: Lot) => x.rh)], cells: [...SL.cells, ...PL.cells, ...XS.flatMap((x: Lot) => x.cells)], other: [...SL.other, ...PL.other, ...XS.flatMap((x: Lot) => x.other)] };
  const LK = (ci: number): string => (ci < NS ? `S${SL.lot}` : ci < NP ? `P${PL.lot}` : `X${XL.lot}`);
  const N = L.cells.length;
  const nm = (i: number): string => (i < NS ? `SC ${i === 0 ? "I" : "II"}` : i < NP ? String(i - NS + 1) : `X${i - NP + 1}`);
  const endNm = nm;
  const clearRows = (from: number, to: number): void => {
    const c = (arr: string[], d: string): string[] => arr.map((v: string, i: number) => (i >= from && i < to ? d : v));
    setRIS(c(rIS, "")); setR37(c(r37, "")); setRx(c(rx, "0")); setExample(false);
  };

  const val = (ci: number, ai: number): string => {
    const k = `${LK(ci)}|${ci}|${ai}`;
    if (edits[k] !== undefined) return edits[k];
    const ch = L.cells[ci][ai];
    return ch === "1" ? "+" : ch === "0" ? "0" : "?";
  };
  const cycle = (ci: number, ai: number): void => {
    const cur = val(ci, ai);
    const next = cur === "+" ? "0" : cur === "0" ? "?" : "+";
    setEdits({ ...edits, [`${LK(ci)}|${ci}|${ai}`]: next });
  };
  const reset = (): void => { setRIS(blank()); setR37(blank()); setRx(zeros()); setAcIS(""); setAc37(""); setAc("0"); setExample(false); };
  const rowR = (ci: number): boolean => [rIS[ci], r37[ci], rx[ci]].some(isReactive);
  const upd = (arr: string[], set: (v: string[]) => void, ci: number, v: string): void => { const n = [...arr]; n[ci] = v; set(n); setExample(false); };
  const loadExample = (): void => {
    const ai = AG.indexOf("Fya");
    setRx(Array.from({ length: NR }, (_v: string, i: number) => (i >= N ? "" : val(i, ai) === "+" ? "2+" : "0")));
    setRIS(blank()); setR37(blank());
    setAc("0"); setAcIS(""); setAc37("");
    setExample(true);
  };

  const analysis = useMemo(() => {
    const ent = (i: number): string[] => [rIS[i], r37[i], rx[i]].filter((g: string) => g !== "" && g !== "nt");
    const tested = Array.from({ length: N }, (_v: unknown, i: number) => i).filter((i: number) => (inclSC || i >= NS) && ent(i).length > 0);
    const neg = tested.filter((i: number) => ent(i).every((g: string) => g === "0"));
    const pos = tested.filter((i: number) => ent(i).some(isReactive));
    const ruled: { ag: string; cells: string[] }[] = [];
    const cands: { ag: string; match: boolean; posPos: number; negNeg: number; unexplained: string[]; homo: number; hetN: number; dNeg: number; lfa: boolean; single: boolean }[] = [];
    AG.forEach((ag: string, ai: number) => {
      const p = PARTNER[ag];
      let used: number[] = [];
      let homo = 0; let hetN = 0; let dNeg = 0;
      const sp = SCHNECK_PARTNER[ag];
      const single = !SCHNECK_DOUBLE.includes(ag) && (!sp || SCHNECK_SINGLE.includes(ag));
      if (!schneck) {
        used = neg.filter((i: number) => {
          if (val(i, ai) !== "+") return false;
          if (p && !het) return val(i, AG.indexOf(p)) === "0";
          return true;
        });
      } else {
        const agPos = neg.filter((i: number) => val(i, ai) === "+");
        const homoCells = sp && !single ? agPos.filter((i: number) => val(i, AG.indexOf(sp)) === "0") : agPos;
        const hetCells = sp && !single ? agPos.filter((i: number) => val(i, AG.indexOf(sp)) === "+") : [];
        const dCells = antiD && (ag === "C" || ag === "E") ? hetCells.filter((i: number) => val(i, AG.indexOf("D")) === "0") : [];
        homo = homoCells.length; hetN = hetCells.length; dNeg = dCells.length;
        if (homoCells.length >= SCH_N) used = homoCells;
        else if (dCells.length >= SCH_N) used = dCells;
      }
      if (used.length > 0) { ruled.push({ ag, cells: used.map(nm) }); return; }
      const unexplained = pos.filter((i: number) => val(i, ai) !== "+").map(nm);
      cands.push({ ag, match: pos.length > 0 && unexplained.length === 0, posPos: pos.filter((i: number) => val(i, ai) === "+").length, negNeg: neg.filter((i: number) => val(i, ai) === "0").length, unexplained, homo, hetN, dNeg, lfa: schneck && SCHNECK_LFA.includes(ag), single });
    });
    const extraPos = schneck ? pos.filter((i: number) => cands.every((c) => val(i, AG.indexOf(c.ag)) !== "+")).map(nm) : [];
    return { tested: tested.length, pos, neg, ruled, cands, extraPos };
  }, [rx, rIS, r37, het, pLot, sLot, xOn, xLot, edits, schneck, antiD, inclSC]);

  const cell: CSSProperties = { padding: "6px 6px", borderBottom: `1px solid ${t.border.subtle}`, textAlign: "center", fontSize: t.font.table.fontSize, color: t.text.primary };
  const head: CSSProperties = { ...cell, color: t.text.secondary, fontWeight: t.weight.medium, borderBottom: `1px solid ${t.border.default}` };
  const brHead: CSSProperties = { padding: "4px 5px", color: "#fff", fontWeight: 600, fontSize: 11, border: "1px solid rgba(255,255,255,0.6)", textAlign: "center", verticalAlign: "bottom", whiteSpace: "normal", wordBreak: "keep-all", overflowWrap: "normal", hyphens: "none" };
  const brCell: CSSProperties = { padding: "4px 5px", border: "1px solid rgba(138, 36, 72, 0.35)", textAlign: "center", verticalAlign: "middle", color: t.text.primary, fontSize: 11, wordBreak: "keep-all", overflowWrap: "normal" };
  const brFill = (c?: string): CSSProperties => (c ? { background: c, color: BR_DARK.has(c) ? "#fff" : "#222" } : {});
  const sel: CSSProperties = { background: t.bg.base, color: t.text.primary, border: `1px solid ${t.border.default}`, borderRadius: 4, padding: "4px 2px", minHeight: 32, fontSize: t.font.table.fontSize, width: "auto", minWidth: 0, appearance: "none", WebkitAppearance: "none", textAlign: "center", textAlignLast: "center", cursor: "pointer" };
  const fix = (w: number): CSSProperties => ({ width: w, minWidth: w, maxWidth: w, boxSizing: "border-box", whiteSpace: "nowrap", borderLeft: "none", borderRight: "none", boxShadow: "none", padding: "6px 2px" });
  const ctl: CSSProperties = { ...cell, ...fix(40) };
  const ctlPh: CSSProperties = { ...cell, ...fix(50) };
  const endCell: CSSProperties = { ...cell, whiteSpace: "nowrap", padding: "6px 8px 6px 4px", fontWeight: t.weight.semibold };
  const BOLD = `4px solid ${t.text.primary}`;
  const HL = "rgba(229, 72, 95, 0.30)";
  const acPos = [acIS, ac37, ac].some(isReactive);
  const BC = "#111111";
  const shadows = (l: boolean, r: boolean, tp: boolean, b: boolean): CSSProperties => {
    const s: string[] = [];
    if (l) s.push(`inset 4px 0 0 0 ${BC}`);
    if (r) s.push(`inset -4px 0 0 0 ${BC}`);
    if (tp) s.push(`inset 0 4px 0 0 ${BC}`);
    if (b) s.push(`inset 0 -4px 0 0 ${BC}`);
    return s.length ? { boxShadow: s.join(", ") } : {};
  };
  const bx = (ai: number, tp = false, b = false): CSSProperties => shadows(BOLD_START.includes(ai), BOLD_END.includes(ai), tp && BOLD_COLS.includes(ai), b && BOLD_COLS.includes(ai));
  const opts = GRADES.map((g: string) => <option key={g} value={g}>{g === "" ? "–" : g}</option>);
  const stickyTd: CSSProperties = { ...cell, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: t.bg.base };
  const lotOpts = (src: Lot[]) => src.map((l: Lot, i: number) => ({ l, i })).filter((x) => x.l.brand === brand).map(({ l, i }) => ({ value: String(i), label: `${l.brand} ${l.product} ${l.lot} (exp ${l.exp})${l.exp < TODAY ? " (expired)" : ""}` }));
  const fv = (a: string): { v: number; tag: string } | null => {
    if (!FREQ[a]) return null;
    const w = num(FREQ[a].wn); const b = num(FREQ[a].bn);
    if (pop === "w") return w === null ? null : { v: w, tag: "White" };
    if (pop === "b") return b === null ? null : { v: b, tag: "Black" };
    if (w === null && b === null) return null;
    if (w === null) return { v: b as number, tag: "Black only; no White value" };
    if (b === null) return { v: w, tag: "White only; no Black value" };
    if (w === 0 && b !== 0) return { v: b, tag: "Black; very rare in White donors" };
    if (b === 0 && w !== 0) return { v: w, tag: "White; very rare in Black donors" };
    return w <= b ? { v: w, tag: w === b ? "White = Black" : "White, lower" } : { v: b, tag: "Black, lower" };
  };
  const calcAgs = AG.filter((a: string) => fv(a) !== null);
  const notRuled = analysis.cands.filter((c) => !c.lfa).map((c) => c.ag);
  const minPos = schneck && rule2 ? 2 : 3;
  const minNeg = schneck && rule2 ? 2 : 3;
  const vRule = minPos === 2 ? "2+/2−" : "3+/3−";
  const effSel = calcAuto ? notRuled : calcSel;
  const noData = calcAuto ? notRuled.filter((a: string) => !calcAgs.includes(a)) : [];
  const calcUsed = effSel.filter((a: string) => calcAgs.includes(a));
  const frac = calcUsed.reduce((p: number, a: string) => p * ((fv(a) as { v: number }).v / 100), 1);
  const toggleAg = (a: string): void => { const base = effSel.filter((x: string) => calcAgs.includes(x)); setCalcAuto(false); setCalcSel(base.includes(a) ? base.filter((x: string) => x !== a) : [...base, a]); };
  const rhCount = calcUsed.filter((a: string) => ["D", "C", "E", "c", "e"].includes(a)).length;
  const RED = "#e0301e";
  const ruledSet = new Set(analysis.ruled.map((r) => r.ag));
  const SLASH = `linear-gradient(to top right, transparent calc(50% - 1.5px), ${RED} calc(50% - 1.5px), ${RED} calc(50% + 1.5px), transparent calc(50% + 1.5px))`;
  const NEGHL = "rgba(56, 132, 255, 0.22)";
  const negSet = new Set(analysis.neg);
  const rowBg = (ci: number): string | null => (hlPos && rowR(ci) ? HL : hlNeg && negSet.has(ci) ? NEGHL : null);
  const agBg = (ai: number): CSSProperties => ({ background: xOut && ruledSet.has(AG[ai]) ? `${SLASH}, ${YEL}` : YEL });
  const gStart = GROUPS.map((_g, i) => GROUPS.slice(0, i).reduce((s, x) => s + x.n, 0));
  const grpBg = (gi: number): CSSProperties => ({ background: AG.slice(gStart[gi], gStart[gi] + GROUPS[gi].n).every((a) => ruledSet.has(a)) && xOut ? `linear-gradient(${RED}, ${RED}) center / 80% 3px no-repeat, ${YEL}` : YEL });
  const anyEntered = analysis.tested > 0;
  const matching = analysis.cands.filter((c) => c.match);
  const [pr, setPr] = useState<boolean>(false);
  useEffect(() => {
    const on = () => setPr(true);
    const off = () => setPr(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => { window.removeEventListener("beforeprint", on); window.removeEventListener("afterprint", off); };
  }, []);
  const doPrint = () => { setPr(true); setTimeout(() => { try { window.print(); } catch (e) { setPr(false); } }, 300); };
  const PRINT_CSS = ".printonly{display:none}@page{size:landscape;margin:0.4in}@media print{html,body{background:#fff !important;color:#000 !important}*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}.noprint,button{display:none !important}.printonly{display:block !important}div{overflow:visible !important;max-height:none !important}th,td{position:static !important}table{font-size:9px !important}th,td{padding:2px 3px !important}tr{break-inside:avoid;page-break-inside:avoid}thead{display:table-header-group}h1,h2,h3{break-after:avoid}}";

  return (
    <Page title="Antibody Rule-Out Tool: Bells and Whistles for Schneck" width="wide" summary="Antibody Identification Worksheet · Grifols Search-Cyte Plus 0.8% screen cells and Data-Cyte Plus panel cells, with Schneck Medical Center Ab ID rules on by default. Pick the screen and panel lots, grade each cell, and see which antibodies are ruled out, which remain, whether the validation rule is met, and how many units to screen.">
      <style>{PRINT_CSS}</style>
      <div className="printonly" style={{ fontSize: 11 }}>Antibody Rule-Out Tool: Bells and Whistles for Schneck · Printed {new Date().toLocaleString()} · Screen lot {SL.lot} (exp {SL.exp}) · Panel lot {PL.lot} (exp {PL.exp}){xOn ? ` · Additional expired panel ${XL.lot} (exp ${XL.exp})` : ""} · Schneck rules {schneck ? "on" : "off"} · Anti-D detected {schneck && antiD ? "on" : "off"} · Heterozygous rule-outs {schneck ? "n/a (Schneck rules on)" : het ? "on" : "off"} · Auto cross-outs {xOut ? "on" : "off"} · Screen cells in cross-outs {inclSC ? "on" : "off"} · Confirmation {schneck && rule2 ? "Rule of Two (2+/2−)" : "Rule of Three (3+/3−)"} · Transfused in last 3 months {txRecent ? "yes" : "not marked"} · Positive IgG DAT {datPos ? "yes" : "not marked"}</div>
      <div className="noprint" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <Button label="Print worksheet" variant="primary" onClick={doPrint} />
        <span style={{ fontSize: 12, color: t.text.secondary }}>Prints landscape with all Reference sections expanded. If nothing happens, use your browser's Print (Ctrl/Cmd+P).</span>
      </div>
      <Callout tone="warning" lead="Bench aid only.">Antigrams were transcribed from phone photos. Always verify against the printed antigram for the lot in use and follow your SOP. Click any antigen cell to correct it (+ → 0 → ?); corrections are not saved. Cells marked ? are unreadable in the photo and never used for rule-outs. ⚠ marks handwritten pen marks on the source sheet.</Callout>
      <Section heading="1. Specimen and reagent lot selection" caption="Screen: Search-Cyte Plus 0.8% (2-cell). Panel: Data-Cyte Plus (11-cell). Additional expired panel is optional and off by default. Schneck rules are on by default.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <Select label="Manufacturer" options={BRANDS} value={brand} onChange={(v: string) => setBrand(v)} />
          <Select label="Screen lot (Search-Cyte Plus 0.8%)" options={lotOpts(B_SCREENS)} value={sLot} onChange={(v: string) => { setSLot(v); clearRows(0, NS); }} />
          <Select label="Panel lot (Data-Cyte Plus)" options={lotOpts(B_LOTS)} value={pLot} onChange={(v: string) => { setPLot(v); clearRows(NS, NP); }} />
          <Toggle label="Add an additional panel (expired lots)" value={xOn} onChange={(v: boolean) => { setXOn(v); clearRows(NP, NR); }} />
          {xOn && <Select label="Additional panel lot (expired)" options={EXPIRED_IDX.filter((i: number) => B_LOTS[i].brand === brand).map((i: number) => ({ value: String(i), label: `${B_LOTS[i].brand} ${B_LOTS[i].product} ${B_LOTS[i].lot}, EXPIRED ${B_LOTS[i].exp}` }))} value={xLot} onChange={(v: string) => { setXLot(v); clearRows(NP, NR); }} />}
          <Toggle label="Allow heterozygous rule-outs (Rh, Kidd, Duffy, MNS)" value={het} onChange={setHet} disabled={schneck} />
          <Toggle label="Schneck rules" value={schneck} onChange={setSchneck} />
          {schneck && <Toggle label="Anti-D detected" value={antiD} onChange={setAntiD} />}
          <Toggle label="Include screen cells in cross-outs" value={inclSC} onChange={setInclSC} />
          {schneck && <Toggle label="Rule of Two (2+/2−): only for low-frequency antibodies (e.g., Cʷ, Kpᵃ) or selected cells in complex multi-antibody cases per medical director validation" value={rule2} onChange={setRule2} />}
          <Button label="Load example (anti-Fyᵃ)" onClick={loadExample} />
          <Button label="Reset" variant="primary" onClick={reset} />
        </div>
      </Section>
      {schneck && <Callout tone="info" lead="Schneck Tech Guide (11/2026) rules active.">{`Only one nonreactive panel cell (negative across all phases) is needed to cross out an antigen. Double-dose required: C (C+c−), c (C−c+), E (E+e−), e (E−e+), Fyᵃ (Fy(a+b−)), Fyᵇ (Fy(a−b+)), Jkᵃ (Jk(a+b−)), Jkᵇ (Jk(a−b+)), M (M+N−), N (M−N+), S (S+s−), s (S−s+); single-dose cells do not rule these out. Single-dose permitted: D, K, P₁, Xgᵃ, Leᵃ, Leᵇ, Luᵃ (Luᵇ is in the guide but is not an antigram column). ${antiD ? "Anti-D detected is on: 1 nonreactive D− C+c+ cell rules out C and 1 nonreactive D− E+e+ cell rules out E." : "Anti-D detected is off."} Antigram antigens the guide does not list: k needs 1 double-dose K−k+ cell; Cʷ and Kpᵃ need 1 antigen-positive cell (no partner on the antigram). Low-frequency V, Cʷ, Kpᵃ, Jsᵃ, Luᵃ may be omitted during the initial exclusion: they are tagged and left out of units to screen. Confirming specificity (not rule-out): Rule of Three, 3 antigen-positive reactive and 3 antigen-negative nonreactive cells (p ≤ 0.05); Rule of Two (2+/2−) only with the option above. The heterozygous toggle is ignored while Schneck rules are on.`}</Callout>}
      {!inclSC && <Text>Screen cells SC I and SC II are still shown in section 2 but are not counted for rule-outs, antibodies not excluded, units to screen, or the 3+/3− (or 2+/2−) counts.</Text>}
      <Section heading="Initial evaluation and autocontrol (Tech Guide section 1)" caption="Schneck Blood Bank Tech Guide: Antibody Identification (11/2026). Checklist reminders; the two switches drive the patient antigen typing reminder in section 3.">
        <Rows rows={[
          { title: "Review patient history", detail: "Verify transfusion and pregnancy history (past 3 months), diagnosis, and past Ab/phenotype records." },
          { title: "Autocontrol / DAT negative", detail: "Suggests alloantibody." },
          { title: "Autocontrol / DAT positive", detail: "Indicates possible autoantibody, drug-induced reactivity, or alloantibody on recently transfused donor cells. Perform DAT." },
        ]} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Toggle label="Transfused in the last 3 months" value={txRecent} onChange={setTxRecent} />
          <Toggle label="Positive IgG DAT" value={datPos} onChange={setDatPos} />
        </div>
      </Section>
      <Section heading="Display options" caption="Display only; rule-out logic and interpretation are unaffected.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Toggle label="Auto cross-outs" value={xOut} onChange={setXOut} />
          <Toggle label="Highlight positive rows" value={hlPos} onChange={setHlPos} />
          <Toggle label="Highlight negative rows" value={hlNeg} onChange={setHlNeg} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", fontSize: 12, color: t.text.secondary }}>
          <span><span style={{ display: "inline-block", width: 14, height: 14, verticalAlign: "middle", marginRight: 6, background: HL, border: `1px solid ${t.border.default}` }}></span>Reactive (positive) row</span>
          <span><span style={{ display: "inline-block", width: 14, height: 14, verticalAlign: "middle", marginRight: 6, background: NEGHL, border: `1px solid ${t.border.default}` }}></span>Nonreactive (negative) row</span>
        </div>
        {hlNeg && <Text>Nonreactive means at least one phase entered and every entered phase 0. AHG defaults to 0, so every row counts as nonreactive on load.</Text>}
      </Section>
      {xOn && <Callout tone="warning" lead={`Additional panel lot ${XL.lot} expired ${XL.exp}.`}>Rows X1–X11 use expired reagent cells. Follow your facility policy for using expired reagents to complete rule-outs.</Callout>}
      <Section heading={`2. Antibody screen and panel results: screen lot ${SL.lot}${SL.exp < TODAY ? " (EXPIRED)" : ""} + panel lot ${PL.lot}${PL.exp < TODAY ? " (EXPIRED)" : ""}`} caption="SC I and SC II are the screen cells; 1–11 are the panel. + positive, 0 negative, ? unreadable. Result blank = not tested.">
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", tableLayout: "auto", fontFamily: t.font.family }}>
            <thead><tr>
              <th rowSpan={2} style={{ ...head, textAlign: "left", position: "sticky", left: 0, zIndex: 2, background: t.bg.base }}>Cell</th><th rowSpan={2} style={head}>Rh</th>
              {GROUPS.map((g, gi) => <th key={g.name} colSpan={g.n} style={{ ...head, ...grpBg(gi), ...(g.bold ? shadows(true, true, true, false) : {}) }}>{g.name}</th>)}
              <th rowSpan={2} style={{ ...head, textAlign: "left" }}>Other</th><th rowSpan={2} style={{ ...head, ...fix(40), fontSize: 10, letterSpacing: -0.2 }}>IS</th><th rowSpan={2} style={{ ...head, ...fix(40), fontSize: 10, letterSpacing: -0.2 }}>37°</th><th rowSpan={2} style={{ ...head, ...fix(50), fontSize: 10, letterSpacing: -0.2 }}>AHG</th><th rowSpan={2} style={{ ...head, whiteSpace: "nowrap", padding: "6px 8px 6px 4px" }}>Cell</th>
            </tr><tr>
              {AG.map((a: string, ai: number) => <th key={a} style={{ ...head, ...agBg(ai), ...bx(ai) }}>{LABEL[a]}</th>)}
            </tr></thead>
            <tbody>
              {L.rh.map((rh: string, ci: number) => (
                <Fragment key={ci}>
                {(ci === NS || ci === NP) && <tr><td colSpan={29} style={{ padding: 0, height: 4, background: t.text.secondary }}></td></tr>}
                <tr style={{ background: rowBg(ci) ?? "transparent" }}>
                  <td style={{ ...cell, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: t.bg.base, backgroundImage: rowBg(ci) ? `linear-gradient(${rowBg(ci)}, ${rowBg(ci)})` : "none" }}>{nm(ci)} <span style={{ color: t.text.tertiary }}>{L.donors[ci]}</span>{ci < NS && !inclSC && <span style={{ color: t.text.warning, fontSize: 10, fontWeight: t.weight.semibold, marginLeft: 4 }}>NOT COUNTED</span>}{ci >= NP && <span style={{ color: t.text.danger, fontSize: 10, fontWeight: t.weight.semibold, marginLeft: 4 }}>EXPIRED {XL.exp}</span>}</td>
                  <td style={cell}>{rh}</td>
                  {AG.map((a: string, ai: number) => {
                    const v = val(ci, ai);
                    const edited = edits[`${LK(ci)}|${ci}|${ai}`] !== undefined;
                    return <td key={a} onClick={() => cycle(ci, ai)} style={{ ...cell, cursor: "pointer", fontWeight: v === "+" ? t.weight.semibold : t.weight.regular, color: v === "?" ? t.text.warning : v === "0" ? t.text.tertiary : t.text.primary, textDecoration: edited ? "underline" : "none", ...bx(ai) }}>{v}</td>;
                  })}
                  <td style={{ ...cell, textAlign: "left", color: t.text.secondary }}>{L.other[ci].toLowerCase().includes("pen") ? <span style={{ color: t.text.warning, fontWeight: t.weight.semibold }}>⚠ {L.other[ci]}</span> : L.other[ci]}</td>
                  <td style={ctl}><select style={sel} value={rIS[ci]} onChange={(e) => upd(rIS, setRIS, ci, e.target.value)}>{opts}</select></td>
                  <td style={ctl}><select style={sel} value={r37[ci]} onChange={(e) => upd(r37, setR37, ci, e.target.value)}>{opts}</select></td>
                  <td style={ctlPh}><select style={sel} value={rx[ci]} onChange={(e) => upd(rx, setRx, ci, e.target.value)}>{opts}</select></td>
                  <td style={endCell}>{endNm(ci)}</td>
                </tr>
                </Fragment>
              ))}
              <tr style={{ background: hlPos && acPos ? HL : "transparent" }}>
                <td style={{ ...stickyTd, backgroundImage: hlPos && acPos ? `linear-gradient(${HL}, ${HL})` : "none" }}>Autocontrol</td><td style={cell}></td>
                {AG.map((a: string, ai: number) => <td key={a} style={{ ...cell, ...bx(ai) }}></td>)}<td style={cell}></td>
                <td style={ctl}><select style={sel} value={acIS} onChange={(e) => setAcIS(e.target.value)}>{opts}</select></td><td style={ctl}><select style={sel} value={ac37} onChange={(e) => setAc37(e.target.value)}>{opts}</select></td><td style={ctlPh}><select style={sel} value={ac} onChange={(e) => setAc(e.target.value)}>{opts}</select></td><td style={endCell}>AC</td>
              </tr>
              <tr>
                <td style={stickyTd}></td><td style={cell}></td>
                {AG.map((a: string, ai: number) => <td key={a} style={{ ...head, ...agBg(ai), ...bx(ai, false, true) }}>{LABEL[a]}</td>)}
                <td style={cell}></td><td style={ctl}></td><td style={ctl}></td><td style={ctlPh}></td><td style={endCell}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <Text>Additional testing on all cells: positive for H, U, Luᵇ, Kpᵇ, Jsᵇ, Vel, Ge, Diᵇ; negative for Vw, Wrᵃ, Diᵃ, except as noted under Other.</Text>
      </Section>
      <Section heading="3. Interpretation" caption="Rule-outs, antibodies not excluded, validation rule, and autocontrol / DAT.">
        {!anyEntered && <Text>Enter results in section 2 to see the interpretation.</Text>}
        {anyEntered && [acIS, ac37, ac].some(isReactive) && <Callout tone="danger" lead="Autocontrol positive.">Perform a DAT; consider a warm or cold autoantibody, recent transfusion (delayed reaction), or drug-related antibody before relying on rule-outs. Tech Guide section 1: positive indicates possible autoantibody, drug-induced reactivity, or alloantibody on recently transfused donor cells. Perform DAT.</Callout>}
        {anyEntered && ![acIS, ac37, ac].some(isReactive) && [acIS, ac37, ac].some((g: string) => g === "0") && <Text>Autocontrol negative: suggests alloantibody (Tech Guide section 1).</Text>}
        {anyEntered && example && <Callout tone="info" lead="Example data.">Every Fyᵃ-positive cell graded 2+ at AHG, all others 0. Not a patient result.</Callout>}
        {anyEntered && schneck && analysis.extraPos.length > 0 && <Callout tone="danger" lead="Unexplained positive reaction(s): account for ALL reactivity.">{`Reactive cell(s) negative for every antibody not ruled out: ${analysis.extraPos.join(", ")}. Tech Guide section 3: ensure 100% of positive reactions are explained; check for additional antibodies (including LFAs), antibodies to high-prevalence antigens, or dosage effects.`}</Callout>}
        {anyEntered && schneck && <Callout tone="warning" lead="Tech Guide section 3: Account for ALL Reactivity.">Ensure 100% of positive reactions are explained. If extra positives exist, check for additional antibodies (including LFAs), antibodies to high-prevalence antigens, or dosage effects.</Callout>}
        {anyEntered && <Rows rows={[
          { title: "Cells graded", detail: `${analysis.pos.length} reactive, ${analysis.neg.length} nonreactive`, meta: `${analysis.tested} of ${N}${inclSC ? "" : " (screen cells not counted)"}` },
          { title: "Single antibody explaining all reactive cells", detail: matching.length ? matching.map((c) => `anti-${LABEL[c.ag]}`).join(", ") : analysis.pos.length ? "None. Consider multiple antibodies, an antibody to an antigen not on the antigram, dosage, or an autoantibody." : "No reactive cells entered.", status: { label: matching.length ? "Pattern match" : analysis.pos.length ? "Not explained" : "Negative", tone: matching.length ? "success" : analysis.pos.length ? "warning" : undefined } },
        ]} />}
        {anyEntered && matching.length > 1 && <Text>More than one candidate fits the pattern; test selected cells to separate them.</Text>}
        {anyEntered && analysis.cands.length > 0 && (
          <Section heading={schneck ? `3a. Not excluded (candidates) and Schneck ${vRule} confirmation` : "3a. Not excluded (candidates) and rule of three"}>
            <Table columns={schneck ? ["Antibody", "Explains reactive cells", "Ag+ reactive", "Ag− nonreactive", `Schneck: ${vRule}`, "Nonreactive Ag+ cells"] : ["Antibody", "Explains reactive cells", "Ag+ reactive", "Ag− nonreactive", "3+/3− (p ≤ 0.05)"]}
              rows={analysis.cands.map((c) => [
                c.lfa ? <span>{`anti-${LABEL[c.ag]}${negTxt(c.ag)} `}<span style={{ fontStyle: "italic", color: t.text.tertiary }}>Low-frequency: may be omitted initially</span></span> : `anti-${LABEL[c.ag]}${negTxt(c.ag)}`,
                c.match ? { text: "Yes", tone: "success" as const } : c.unexplained.length ? `No (cells ${c.unexplained.join(", ")} Ag−/?)` : "No reactive cells",
                String(c.posPos), String(c.negNeg),
                c.posPos >= minPos && c.negNeg >= minNeg ? { text: `Met (${c.posPos}+/${c.negNeg}−)`, tone: "success" as const } : { text: `Not met (${c.posPos}+/${c.negNeg}−)`, tone: "warning" as const },
                ...(schneck ? [c.single ? `single dose OK: ${c.homo} of 1` : `double dose ${c.homo} of 1${antiD && (c.ag === "C" || c.ag === "E") ? ` / D− ${c.ag === "C" ? "C+c+" : "E+e+"} ${c.dNeg} of 1` : ""} (${c.hetN} single-dose, not accepted)`] : []),
              ])} />
            <Text>Candidates with no matching pattern still need rule-out with selected cells if clinically significant.</Text>
          </Section>
        )}
        {anyEntered && analysis.ruled.length > 0 && (
          <Section heading="3b. Rule-out">
            <Table columns={["Antibody", `Ruled out on nonreactive cell(s)`]} rows={analysis.ruled.map((r) => [`anti-${LABEL[r.ag]}`, r.cells.join(", ")])} />
            <Text>{schneck ? `Schneck Tech Guide (11/2026), only one needed: 1 nonreactive double-dose (homozygous) cell for C, c, E, e, Fyᵃ, Fyᵇ, Jkᵃ, Jkᵇ, M, N, S, s (and k: K−k+); 1 nonreactive antigen-positive cell for D, K, P₁, Xgᵃ, Leᵃ, Leᵇ, Luᵃ, Cʷ, Kpᵃ; with Anti-D detected on, 1 nonreactive D− C+c+ / D− E+e+ cell for C / E.${inclSC ? "" : " Screen cells are not counted."}` : het ? "Heterozygous cells are being used for rule-outs (toggle on)." : "Rh (C, c, E, e), Kidd, Duffy and MNS antigens are ruled out only on homozygous cells; all others on any antigen-positive nonreactive cell."}</Text>
          </Section>
        )}
        {anyEntered && schneck && <Section heading="3c. Patient antigen typing (Tech Guide section 4)">
          {(txRecent || datPos) ? <Callout tone="danger" lead="STOP: do NOT perform routine serologic phenotyping.">{`${txRecent ? "The patient was transfused in the last 3 months (risk of mixed-field reactions). " : ""}${datPos ? "The patient has a positive IgG DAT (risk of false-positive reactions at the IAT phase). " : ""}Action: in these cases, utilize molecular RBC genotyping or historical pre-transfusion records.`}</Callout> : <Text>{`Requirement: patient must type antigen-negative for the suspected corresponding antibody${matching.length ? ` (${matching.map((c) => `${LABEL[c.ag]}−`).join(", ")})` : ""}. STOP, do not perform routine serologic phenotyping if the patient was transfused in the last 3 months or has a positive IgG DAT (mark these in section 1); use molecular RBC genotyping or historical pre-transfusion records instead.`}</Text>}
        </Section>}
      </Section>
      <Section heading="4. Antigen-negative units (units to screen)" caption="Uses this Page's antigen-negative frequencies. Assumes antigens are inherited independently.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Button label="Donor unknown" variant={pop === "u" ? "primary" : undefined} onClick={() => setPop("u")} />
          <Button label="White donors" variant={pop === "w" ? "primary" : undefined} onClick={() => setPop("w")} />
          <Button label="Black donors" variant={pop === "b" ? "primary" : undefined} onClick={() => setPop("b")} />
          <Button label={calcAuto ? "Using antibodies not excluded (live)" : "Use antibodies not excluded"} variant={calcAuto ? "primary" : undefined} onClick={() => setCalcAuto(true)} />
          <Button label="Clear" onClick={() => { setCalcAuto(false); setCalcSel([]); }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {calcAgs.map((a: string) => <Button key={a} label={`anti-${LABEL[a]}`} variant={effSel.includes(a) ? "primary" : undefined} onClick={() => toggleAg(a)} />)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Button label="−" onClick={() => setNeed(Math.max(1, need - 1))} />
          <span style={{ fontSize: t.font.table.fontSize, color: t.text.primary, fontVariantNumeric: "tabular-nums" }}>{need} compatible unit{need === 1 ? "" : "s"} needed</span>
          <Button label="+" onClick={() => setNeed(need + 1)} />
        </div>
        <Rows rows={[
          { title: "Antibodies", detail: calcUsed.length ? calcUsed.map((a: string) => `anti-${LABEL[a]}`).join(", ") + (noData.length ? ` (no frequency data: ${noData.map((a: string) => `anti-${LABEL[a]}`).join(", ")})` : "") : calcAuto ? (notRuled.length ? `No frequency data: ${noData.map((a: string) => `anti-${LABEL[a]}`).join(", ")}` : "All antibodies ruled out; no antigen-negative units needed") : "None selected", meta: pop === "u" ? "Worst-case estimate (donor ethnicity unknown)" : pop === "w" ? "White donors" : "Black donors" },
          ...(calcUsed.length ? [{ title: "Values used", detail: calcUsed.map((a: string) => { const f = fv(a) as { v: number; tag: string }; return `${LABEL[a]}− ${f.v}% (${f.tag})`; }).join(" · ") }] : []),
          { title: "Combined antigen-negative", detail: calcUsed.length ? `${(frac * 100).toFixed(frac < 0.01 ? 3 : 1)}%` : "–", meta: calcUsed.length ? calcUsed.map((a: string) => `${(fv(a) as { v: number }).v}%`).join(" × ") : "" },
          { title: "About 1 in", detail: calcUsed.length ? (frac > 0 ? `${Math.round(1 / frac).toLocaleString()} units` : "No compatible donors expected; contact your blood supplier / rare donor program") : "–" },
          { title: "Units to screen", detail: calcUsed.length ? (frac > 0 ? `${Math.ceil(need / frac).toLocaleString()} units for ${need} compatible` : "–") : "–" },
        ]} />
        {pop === "u" && <Text>Worst-case estimate (donor ethnicity unknown): each antigen uses the lower of the White and Black antigen-negative values, so a mixed donor pool will usually need fewer units.</Text>}
        {schneck && calcAuto && <Text>Schneck rules: low-frequency antibodies (V, Cʷ, Kpᵃ, Jsᵃ, Luᵃ) not yet ruled out are left out of the live selection; tap a chip to add one.</Text>}
        <Text>{`Antigens without a verified frequency for the chosen population (Cʷ, Xgᵃ, and Black values not on this Page) are not offered.${rhCount > 1 ? " Rh antigens are inherited together as haplotypes (e.g. C with e, c with E), so this product is only approximate for Rh combinations; check Rh phenotype frequencies in section 5." : ""} Approximation only; follow your SOP.`}</Text>
      </Section>
      <Section heading="5. Reference" caption="Antigen frequencies, clinical significance, phenotypes, antibody frequencies, Bio-Rad and dosage references, Schneck helpful hints (superseded), then the guides and charts at the end: Schneck Tech Guide (11/2026), compatibility chart, component selection, cryo & plasma compatibility, Ortho Antibody Index Chart and Grifols antigens & antibodies poster. Tap a heading to expand.">
      <Section key={pr ? "p51" : "s51"} heading="5.1 Antigen frequencies" collapsible defaultOpen={pr}>
        <Callout tone="info" lead="Population estimates.">Frequencies are rounded population estimates from published references; verify against your lab's reference. Cw is omitted (could not verify). Xga is X-linked: F = females, M = males (Northern European data); no verified Black value. Lewis values are for adults. Verify against your facility's SOP and reference before selecting units.</Callout>
        <Text>Highlighted rows: antibodies to these antigens are clinically significant, so give antigen-negative units.</Text>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "auto", fontFamily: t.font.family }}>
            <thead><tr>
              {[["Antigen"], ["System"], ["White", "antigen", "positive %"], ["Black", "antigen", "positive %"], ["White", "antigen", "negative %", "(compatible", "units)"], ["Black", "antigen", "negative %", "(compatible", "units)"], ["Clinical", "significance"], ["Source"]].map((lines: string[], i: number) => (
                <th key={i} style={{ padding: "4px 5px", fontSize: 11, lineHeight: 1.25, fontWeight: t.weight.medium, color: t.text.secondary, borderBottom: `1px solid ${t.border.default}`, textAlign: i < 2 ? "left" : "center", verticalAlign: "bottom", width: "1%", wordBreak: "normal", overflowWrap: "normal", hyphens: "none", boxSizing: "border-box", ...(i === 0 ? { position: "sticky", left: 0, zIndex: 1, background: t.bg.base } : {}) }}>{lines.map((ln: string, j: number) => <span key={j} style={{ display: "block", whiteSpace: "nowrap" }}>{ln}</span>)}</th>
              ))}
            </tr></thead>
            <tbody>
              {AG.filter((a: string) => FREQ[a]).map((a: string) => { const f = FREQ[a]; return (
                <tr key={a} style={{ background: CLIN[a]?.[1] ? PINK : "transparent" }}>
                  {[LABEL[a], f.sys, pct(f.w), f.b === null ? "–" : pct(f.b), pct(f.wn), f.bn === null ? "–" : pct(f.bn), CLIN[a]?.[0] ?? "", f.src].map((v: string, i: number) => (
                    <td key={i} style={{ padding: "6px 5px", fontSize: i === 6 ? 12 : t.font.table.fontSize, color: i === 0 ? t.text.primary : i === 1 || i === 7 ? t.text.secondary : t.text.primary, fontWeight: i === 0 ? t.weight.medium : t.weight.regular, borderBottom: `1px solid ${t.border.subtle}`, textAlign: i < 2 || i === 6 ? "left" : "center", whiteSpace: i === 6 ? "normal" : "nowrap", minWidth: i === 6 ? 150 : undefined, wordBreak: "normal", overflowWrap: "normal", hyphens: "none", fontVariantNumeric: "tabular-nums", ...(i === 0 ? { position: "sticky", left: 0, zIndex: 1, background: t.bg.base, backgroundImage: CLIN[a]?.[1] ? `linear-gradient(${PINK}, ${PINK})` : "none" } : {}) }}>{v}</td>
                  ))}
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        <Text>Sources: {SOURCES.join(" · ")}</Text>
      </Section>
      <Section key={pr ? "p52" : "s52"} collapsible defaultOpen={pr} heading="5.2 Clinically significant antibodies: antigen-negative units needed" caption="Percent of donors who are antigen-negative (compatible units).">
        <Table columns={["Antigen", "White Ag−", "Black Ag−", "Source"]} rows={[...AG.filter((a: string) => FREQ[a] && CLIN[a]?.[1]).map((a: string) => [LABEL[a], pct(FREQ[a].wn), FREQ[a].bn === null ? "not verified" : pct(FREQ[a].bn as string), FREQ[a].src]), ...SIG_EXTRA]} />
        <Text>Jsᵇ and U are also clinically significant, but their antigen-negative frequencies could not be verified, so they are left out; both negatives are rare and found mainly in Black donors.</Text>
      </Section>
      <Section key={pr ? "p53" : "s53"} collapsible defaultOpen={pr} heading="5.3 Antibodies generally not clinically significant: antigen-negative units not required" caption="Percent of donors who are antigen-negative.">
        <Table columns={["Antigen", "White Ag−", "Black Ag−", "Source", "Note"]} rows={[...AG.filter((a: string) => FREQ[a] && CLIN[a] && !CLIN[a][1]).map((a: string) => [LABEL[a], pct(FREQ[a].wn), FREQ[a].bn === null ? "not verified" : pct(FREQ[a].bn as string), FREQ[a].src, CLIN[a][0]]), ...NONSIG_EXTRA]} />
        <Callout tone="warning" lead="Caveat.">Anti-M, anti-P1 and Lewis antibodies that react at 37°C or AHG can be clinically significant. Follow facility policy; AHG crossmatch-compatible units usually suffice.</Callout>
      </Section>
      <Section key={pr ? "p54" : "s54"} collapsible defaultOpen={pr} heading="5.4 Major blood group phenotypes" caption="Percent of donors with each phenotype. Sources are lettered below.">
        <Table columns={["System", "Phenotype", "White", "Black", "Source"]} rows={PHENO} />
      </Section>
      <Section key={pr ? "p55" : "s55"} collapsible defaultOpen={pr} heading="5.5 Antibody frequencies" caption="Share of 1,815 alloantibodies identified in one French regional series (source E). Rates vary by population and patient group.">
        <Table columns={["Rank", "Antibody", "% of alloantibodies"]} rows={ABFREQ} />
        <Text>Lettered sources: {SRC2.join(" · ")}</Text>
      </Section>
      <Section key={pr ? "p56" : "s56"} collapsible defaultOpen={pr} heading="5.6 Characteristics of blood group antibodies (Bio-Rad)" caption="Source: Bio-Rad Laboratories, Characteristics of Blood Group Antibodies chart, bio-rad.com/immunohematology (Bulletin H005165, 2019/02). Transcribed as printed; blank = blank on the chart.">
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", tableLayout: "auto", fontFamily: t.font.family, fontSize: 11 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...brHead, background: BR_MAROON, position: "sticky", left: 0, zIndex: 2, textAlign: "left" }}>Antibody</th>
                <th rowSpan={2} style={{ ...brHead, background: BR_MAROON }}>ISBT Symbol</th>
                <th colSpan={2} style={{ ...brHead, background: "#1d2a57" }}>Immunoglobulin class</th>
                <th colSpan={5} style={{ ...brHead, background: "#1d2a57" }}><i>In vitro</i> characteristics</th>
                <th colSpan={2} style={{ ...brHead, background: "#1d2a57" }}>Associated with</th>
                <th colSpan={3} style={{ ...brHead, background: "#1d2a57" }}>Antigen Frequency (%)</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d2a57", minWidth: 220 }}>Remarks</th>
              </tr>
              <tr>
                <th style={{ ...brHead, background: BR_MAROON }}>IgM</th>
                <th style={{ ...brHead, background: BR_MAROON }}>IgG</th>
                <th style={{ ...brHead, background: "#1f5aa6" }}>Saline RT</th>
                <th style={{ ...brHead, background: "#0b8a45" }}>IAT 37°C</th>
                <th style={{ ...brHead, background: "#d42027" }}>Papain 37°C*</th>
                <th style={{ ...brHead, background: BR_MAROON }}>May show dosage</th>
                <th style={{ ...brHead, background: BR_MAROON }}>Complement binding</th>
                <th style={{ ...brHead, background: BR_MAROON }}>HDFN</th>
                <th style={{ ...brHead, background: BR_MAROON }}>HTR</th>
                <th style={{ ...brHead, background: BR_MAROON }}>Caucasians</th>
                <th style={{ ...brHead, background: BR_MAROON }}>Blacks</th>
                <th style={{ ...brHead, background: BR_MAROON }}>Others</th>
              </tr>
            </thead>
            <tbody>
              {BIORAD.map(([sys, rows]) => (
                <Fragment key={sys}>
                  <tr><td colSpan={15} style={{ ...brCell, background: `linear-gradient(90deg, ${BR_MAROON}, #b4637a)`, color: "#fff", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}><span style={{ position: "sticky", left: 6 }}>{sys}</span></td></tr>
                  {rows.map((r) => (
                    <tr key={r[0]}>
                      <td style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: t.bg.base }}>{r[0]}</td>
                      <td style={{ ...brCell, fontWeight: 700, whiteSpace: "nowrap" }}>{r[1]}</td>
                      <td style={brCell}>{r[2]}</td>
                      <td style={brCell}>{r[3]}</td>
                      <td style={{ ...brCell, ...brFill(BR_BLUE[r[4]]) }}>{r[4]}</td>
                      <td style={{ ...brCell, ...brFill(BR_GREEN[r[5]]) }}>{r[5]}</td>
                      <td style={{ ...brCell, ...brFill(BR_RED[r[6]]), whiteSpace: "nowrap", fontSize: 13 }}>{r[6]}</td>
                      <td style={brCell}>{r[7]}</td>
                      <td style={brCell}>{r[8]}</td>
                      <td style={brCell}>{r[9]}</td>
                      <td style={brCell}>{r[10]}</td>
                      {r[11].map(([txt, span], k) => <td key={k} colSpan={span} style={{ ...brCell, minWidth: span > 1 ? undefined : 52 }}>{txt}</td>)}
                      <td style={{ ...brCell, textAlign: "left", minWidth: 220 }}>{r[12]}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Text>Legend* (Papain-treated cells, 37°C): ↑↑ markedly enhanced · ↑ enhanced · ↔ unaffected · ↓ weakened · ↓↓ denatured · V variable. Cell shading follows the chart: Saline RT in blue, IAT 37°C in green and Papain 37°C in red, darker meaning more often reactive (Yes, Most) or more enhanced, lighter meaning Some, Rare or Very rare, or weakened/denatured. HDFN and HTR are not color-coded on the chart.</Text>
        <Text>Abbreviations: AIHA autoimmune hemolytic anemia · CHAD cold hemagglutinin disease · DAT direct antiglobulin test · HDFN hemolytic disease of the fetus and newborn · HTR hemolytic transfusion reaction · IAT indirect antiglobulin test · Ig immunoglobulin · ISBT International Society of Blood Transfusion · LISS low-ionic strength solution · PCH paroxysmal cold hemoglobinuria · RBC red blood cell · RT room temperature.</Text>
        <Text>Chart bibliography: Reid ME, Lomas-Francis C, Olsson ML. The Blood Group Antigen FactsBook. 3rd ed. Oxford: Elsevier; 2012 · Daniels G. Human Blood Groups. 3rd ed. Oxford: Wiley-Blackwell; 2013 · Klein HG, Anstee D. Mollison’s Blood Transfusion in Clinical Medicine. 12th ed. Oxford: Wiley-Blackwell; 2014 · Issitt PD, Anstee D. Applied Blood Group Serology. 4th ed. Durham (NC): Montgomery Scientific Publications; 1998.</Text>
      </Section>
      <Section key={pr ? "p57" : "s57"} collapsible defaultOpen={pr} heading="5.7 Dosage (zygosity) reference" caption="Sources are lettered in the last column and listed below the table.">
        <Text>Dosage: for some antibodies, red cells from a person homozygous for the antigen (double dose, antithetical antigen absent) react more strongly than heterozygous cells (single dose, antithetical antigen present). A weak antibody may react only with double-dose cells, so a nonreactive heterozygous cell may not safely rule it out. Antibodies in the Rh (excluding D), Kidd, Duffy and MNS systems may show dosage (sources B, G).</Text>
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", fontFamily: t.font.family, fontSize: 11 }}>
            <thead><tr>
              <th style={{ ...brHead, background: BR_MAROON, textAlign: "left" }}>Example (anti-Jkᵃ)</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Genotype</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Jkᵃ dose</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Expected reaction</th>
            </tr></thead>
            <tbody>
              {[["Jk(a+b−)", "Jkᵃ/Jkᵃ homozygous", "Double", 100, "Stronger"], ["Jk(a+b+)", "Jkᵃ/Jkᵇ heterozygous", "Single", 50, "Weaker, may be negative"], ["Jk(a−b+)", "Jkᵇ/Jkᵇ", "None", 0, "Negative"]].map((r) => (
                <tr key={r[0] as string}>
                  <td style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}>{r[0]}</td>
                  <td style={brCell}>{r[1]}</td>
                  <td style={brCell}>{r[2]}</td>
                  <td style={{ ...brCell, textAlign: "left" }}><span style={{ display: "inline-block", width: 60, height: 8, background: t.bg.subtle, border: `1px solid ${t.border.default}`, verticalAlign: "middle", marginRight: 6 }}><span style={{ display: "block", width: `${r[3]}%`, height: "100%", background: "#d42027" }}></span></span>{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Text>Illustration of the principle (sources B, C). Bar length is illustrative, not a measured grade.</Text>
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", tableLayout: "auto", fontFamily: t.font.family, fontSize: 11 }}>
            <thead><tr>
              <th style={{ ...brHead, background: BR_MAROON, position: "sticky", left: 0, zIndex: 2, textAlign: "left" }}>System</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Antigen pair</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Shows dosage?</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Homozygous (double-dose) example</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Heterozygous (single-dose) example</th>
              <th style={{ ...brHead, background: BR_MAROON, minWidth: 220 }}>Notes</th>
              <th style={{ ...brHead, background: BR_MAROON }}>Source</th>
            </tr></thead>
            <tbody>
              {DOSE.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: t.bg.base }}>{r[0]}</td>
                  <td style={{ ...brCell, whiteSpace: "nowrap" }}>{r[1]}</td>
                  <td style={{ ...brCell, background: DOSE_COL[r[2]], color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>{r[2]}</td>
                  <td style={brCell}>{r[3]}</td>
                  <td style={brCell}>{r[4]}</td>
                  <td style={{ ...brCell, textAlign: "left", minWidth: 220 }}>{r[5]}</td>
                  <td style={{ ...brCell, whiteSpace: "nowrap" }}>{r[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: t.text.secondary }}>
          {Object.entries(DOSE_COL).map(([k, c]) => <span key={k}><span style={{ display: "inline-block", width: 12, height: 12, background: c, verticalAlign: "middle", marginRight: 4 }}></span>{k === "Yes" ? "Yes: may show dosage" : k === "Variable" ? "Variable: antigen strength varies, not classic genetic dosage" : k === "No" ? "No: no dosage / not applicable" : "Not verified: not confirmed in the sources checked"}</span>)}
        </div>
        <Text>On this Page: the rule-out logic uses homozygous cells only for Rh (C, c, E, e), Kidd, Duffy and MNS unless the 'Allow heterozygous rule-outs (Rh, Kidd, Duffy, MNS)' toggle in section 1 is on.</Text>
        <Text>With Schneck rules on (the default here), that toggle is ignored and the Schneck Tech Guide (11/2026) rules in section 5.9 apply instead (the Helpful Hints in 5.8 are superseded).</Text>
        <Text>Sources: {DOSE_SRC.join(" · ")}</Text>
      </Section>
      <Section key={pr ? "p58" : "s58"} collapsible defaultOpen={pr} heading="5.8 Schneck Ab ID Helpful Hints (superseded by 11/2026 Tech Guide)" caption="Source: Schneck Medical Center blood bank SOP, Ab ID Helpful Hints sheet. Transcribed as written. Superseded by the Schneck Blood Bank Tech Guide: Antibody Identification (11/2026), section 5.9; kept for reference only.">
        <Table columns={["Rule", "As written on the sheet"]} rows={SCH_HINTS} />
        <Text>How earlier versions of this Page applied it (superseded, no longer used): 2 nonreactive double-dose cells rule out; the single-dose exceptions and the Anti-D C+c+ / E+e+ allowance also need 2 nonreactive cells; otherwise 3 nonreactive single-dose cells. f is listed on the sheet but is not on the Grifols antigram, so it is not used. V and Jsᵃ are not antigram columns, so only Cʷ, Kpᵃ and Luᵃ are tagged in the candidates table.</Text>
      </Section>
      <Section key={pr ? "p59" : "s59"} collapsible defaultOpen={pr} heading="5.9 Schneck Blood Bank Tech Guide: Antibody Identification (11/2026)" caption="Source: Schneck Medical Center, 411 W. Tipton, Seymour, IN 47274. Blood Bank Tech Guide: Antibody Identification, dated 11/2026 (2 pages). Transcribed as written. The Schneck rules on this Page follow this guide.">
        <Text>1. Initial Evaluation & Autocontrol</Text>
        <Table columns={["Item", "As written in the guide"]} rows={TG1} />
        <Text>2. Antigen Exclusion (Rule-Out) Criteria (Only one needed). Use non-reactive panel cells (negative across all phases) to cross out antigens.</Text>
        <Table columns={["Exclusion Type", "Blood Group Systems & Allowed Cells"]} rows={TG2} />
        <Text>Note: Low-Frequency Antigens (V, Cʷ, Kpᵃ, Jsᵃ, Luᵃ) may be omitted during the initial exclusion process.</Text>
        <Text>3. Confirming Antibody Specificity (this is not the rule out criteria)</Text>
        <Table columns={["Item", "As written in the guide"]} rows={TG3} />
        <Text>4. Patient Antigen Typing (Phenotyping)</Text>
        <Table columns={["Item", "As written in the guide"]} rows={TG4} />
        <Text>{TG_APPLY}</Text>
      </Section>
      <Section key={pr ? "p510" : "s510"} collapsible defaultOpen={pr} heading="5.10 Blood Type Compatibility Chart" caption="Source: 'BLOOD TYPE COMPATIBILITY CHART **' posted in the Schneck blood bank (photo). Header: Donor Can Be for..... Transcribed as printed. The text of the ** footnote is not in the photo.">
        <Table columns={["Blood Type of Recipient", "Red Cells", "Whole Blood", "Plasma"]} rows={COMPAT} />
      </Section>
      <Section key={pr ? "p511" : "s511"} collapsible defaultOpen={pr} heading="5.11 Selection of components when ABO-identical donors are not available" caption="Source: label posted in the Schneck blood bank (photo). Transcribed as printed; every cell was legible.">
        <Table columns={["Component", "ABO Requirements"]} rows={SELC} />
        <Text>*If a large volume of plasma is administered, components compatible with the recipient's red cells are preferred.</Text>
      </Section>
      <Section key={pr ? "p512" : "s512"} collapsible defaultOpen={pr} heading="5.12 Cryo & Plasma Compatibility (Schneck substitution list)" caption="Source: Schneck Medical Center blood bank posted sheet, 'Selection of units (substitution list)'. Transcribed by Alexis from the photo, as printed. Rows = recipient blood type; columns = donor blood type.">
        <Text>Donor Cryo</Text>
        <Table columns={["Recipient", "Donor O", "Donor A", "Donor B", "Donor AB"]} rows={CRYO} />
        <Text>Table note 1. Assumes absence of strong atypical antibodies in donor cryoprecipitate. Y= best compatibility, although all types of cryoprecipitate are deemed compatible with any recipient blood type.</Text>
        <Text>Plasma compatibility (blank = not listed on the sheet)</Text>
        <Table columns={["Recipient", "Donor plasma O", "Donor plasma A", "Donor plasma B", "Donor plasma AB"]} rows={PLASMA} />
        <Text>Table note 1. Assumes absence of strong atypical antibodies in donor plasma</Text>
      </Section>
      <Section key={pr ? "p513" : "s513"} collapsible defaultOpen={pr} heading="5.13 Ortho Antibody Index Chart" caption="Source: Ortho-Clinical Diagnostics (a Johnson & Johnson company), ANTIBODY INDEX CHART, © Ortho-Clinical Diagnostics 2002 (footer code read as BB9070, 12/02). Transcribed from the full-chart photo and close-ups, cross-checked row by row. Spelling as printed.">
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", tableLayout: "auto", fontFamily: t.font.family, fontSize: 11 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b", position: "sticky", left: 0, zIndex: 2, textAlign: "left" }}>Antibody</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>ISBT</th>
                <th colSpan={3} style={{ ...brHead, background: "#c2185b" }}>Common Reaction Mode</th>
                <th colSpan={3} style={{ ...brHead, background: "#c2185b" }}>Column Agglutination Reaction</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>Natural (stimulus unknown)</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>Immune (Transfusion or Pregnancy)</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>Transfusion Reaction</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>HDN</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b" }}>Reactivity with Enzyme Treated RBC</th>
                <th colSpan={2} style={{ ...brHead, background: "#c2185b" }}>% Blood Compatibility</th>
                <th rowSpan={2} style={{ ...brHead, background: "#c2185b", minWidth: 220 }}>Remarks</th>
              </tr>
              <tr>
                {["RT", "37°C", "AHG", "Buffered Gel Card RT", "Buffered Gel Card 37°C", "IgG Card 37°C", "Caucasians", "African-Americans"].map((h: string) => <th key={h} style={{ ...brHead, background: "#c2185b" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ORTHO.map(([sys, rows]) => (
                <Fragment key={sys}>
                  <tr><td colSpan={16} style={{ ...brCell, background: "#2b2b2b", color: "#fff", fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}><span style={{ position: "sticky", left: 6 }}>Blood Group System: {sys}</span></td></tr>
                  {rows.map((r: OR, j: number) => (
                    <tr key={r[1] + r[0]}>
                      <td style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: t.bg.base }}>{r[0]}</td>
                      <td style={{ ...brCell, whiteSpace: "nowrap" }}>{r[1]}</td>
                      {r[2].split("").map((d: string, k: number) => <td key={k} title={OR_PH[k]} style={{ ...brCell, color: OR_DOT[k], fontSize: 14, lineHeight: 1 }}>{d === "1" ? "●" : ""}</td>)}
                      {[r[3], r[4], r[5], r[6], r[7], r[8], r[9]].map((v: string, k: number) => <td key={k} style={{ ...brCell, whiteSpace: "nowrap" }}>{v}</td>)}
                      {r[10] !== "^" && <td rowSpan={spanOf(rows, j, 10)} style={{ ...brCell, textAlign: "left", minWidth: 220 }}>{r[10]}</td>}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Text>Legend: <span style={{ color: OR_DOT[0], fontSize: 14 }}>●</span> RT · <span style={{ color: OR_DOT[1], fontSize: 14 }}>●</span> 37° C · <span style={{ color: OR_DOT[2], fontSize: 14 }}>●</span> AHG = Reaction occasionally or usually occurs at this stage. No Color = Reaction rarely or infrequently occurs at this stage. On the chart, Buffered Gel Card dots use the RT / 37° C colors and IgG Card 37°C dots use the AHG color.</Text>
        <Text>On the chart the Leᵃ remark spans the Leᵃ and Leᵇ rows and the HTLA remark spans all seven HTLA rows; they are shown merged the same way here. Blank cells are blank on the chart.</Text>
      </Section>
      <Section key={pr ? "p514" : "s514"} collapsible defaultOpen={pr} heading="5.14 Grifols Human Blood Group Antigens & Antibodies" caption="Source: Grifols (Blood Typing Solutions), Human Blood Group Antigens & Antibodies poster. Transcribed as printed, including decimal commas and footnote marks; the Blood Group System and Antigen columns, footnotes and references were transcribed by Alexis from the poster photos. · = dot printed on the poster.">
        <div style={{ overflowX: "auto", paddingRight: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "auto", tableLayout: "auto", fontFamily: t.font.family, fontSize: 11 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a", position: "sticky", left: 0, zIndex: 2, textAlign: "left", width: 120, minWidth: 120, maxWidth: 120, boxSizing: "border-box" }}>Blood Group System</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a", position: "sticky", left: 120, zIndex: 2, textAlign: "left" }}>Antigen</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a" }}>ISBT Symbol</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a" }}>Gene(s)</th>
                <th colSpan={3} style={{ ...brHead, background: "#1d3a8a" }}>Antigen Occurrence (%)</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a" }}>Antigen Density</th>
                <th rowSpan={2} style={{ ...brHead, background: "#1d3a8a" }}>Immunoglobulin Class</th>
                <th colSpan={4} style={{ ...brHead, background: "#1d3a8a" }}>Antibody Detection Technique</th>
                <th colSpan={2} style={{ ...brHead, background: "#1d3a8a" }}>Clinical significance</th>
              </tr>
              <tr>
                {["Caucasian", "Black", "Asian", "4°C - RT", "IAT", "Papain /Ficin†", "DTT 0.2M†", "HTR", "HDFN"].map((h: string) => <th key={h} style={{ ...brHead, background: "#1d3a8a" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {GRIF.map(([gene, rows]) => (
                <Fragment key={gene}>
                  {rows.map((r: GR, j: number) => (
                    <tr key={r[0]}>
                      {GRIF_SPAN[r[0]] !== undefined && <td rowSpan={GRIF_SPAN[r[0]]} style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "normal", position: "sticky", left: 0, zIndex: 1, background: t.bg.base, width: 120, minWidth: 120, maxWidth: 120, boxSizing: "border-box" }}>{GRIF_SYS(r[0])}</td>}
                      <td style={{ ...brCell, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 120, zIndex: 1, background: t.bg.base }}>{GRIF_L[r[0]] ? GRIF_L[r[0]][1] : ""}</td>
                      <td style={{ ...brCell, whiteSpace: "nowrap" }}>{r[0]}</td>
                      {j === 0 && <td rowSpan={rows.length} style={{ ...brCell, whiteSpace: "nowrap" }}>{gene}</td>}
                      {r.slice(1).map((v: string, k: number) => <td key={k} style={{ ...brCell, whiteSpace: "nowrap", background: GR_BG[k + 1] }}>{v}</td>)}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Text>Color code: the poster colors antigens red (high prevalence), blue (polymorphic) or green (low prevalence). Per-antigen color coding not transcribed; see original poster.</Text>
        <Text>Footnotes</Text>
        {GRIF_FOOT.map((f: string) => <Text key={f}>{f}</Text>)}
        <Text>References</Text>
        {GRIF_REFS.map((f: string) => <Text key={f}>{f}</Text>)}
      </Section>
      </Section>
    </Page>
  );
}
