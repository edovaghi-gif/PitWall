const fs = require('fs');
const path = require('path');

const circuits = {
  bahrain: {
    name: "Bahrain International Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Frenata pesante dopo il rettilineo di partenza, spesso teatro di sorpassi.", speed: "95 km/h", g: "3.8G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Chicane tecnica che richiede precisione nel cambio di direzione.", speed: "105 km/h", g: "3.2G", pointIndex: 20 },
      { id: 3, name: "Curva 10", sector: 2, desc: "Curva ad alta velocità che mette a dura prova il carico aerodinamico.", speed: "195 km/h", g: "4.1G", pointIndex: 42 },
      { id: 4, name: "Curva 13", sector: 2, desc: "Hairpin lento, zona chiave per i pit stop e i sorpassi.", speed: "65 km/h", g: "2.9G", pointIndex: 58 },
      { id: 5, name: "Curva 15", sector: 3, desc: "Sequenza veloce verso il rettilineo finale.", speed: "245 km/h", g: "3.5G", pointIndex: 75 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Media", safetyCar: "4 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  jeddah: {
    name: "Jeddah Corniche Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima curva del circuito cittadino più veloce del calendario.", speed: "185 km/h", g: "3.9G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Sequenza cieca ad alta velocità, uno dei tratti più adrenalinici in F1.", speed: "270 km/h", g: "4.5G", pointIndex: 18 },
      { id: 3, name: "Curva 13", sector: 2, desc: "Chicane lenta vicino alle barriere, zona di contatto frequente.", speed: "75 km/h", g: "3.1G", pointIndex: 40 },
      { id: 4, name: "Curva 22", sector: 2, desc: "Curva veloce sul lungomare, visuale spettacolare sul Mar Rosso.", speed: "295 km/h", g: "4.8G", pointIndex: 62 },
      { id: 5, name: "Curva 27", sector: 3, desc: "Ultima chicane prima del lungo rettilineo finale.", speed: "110 km/h", g: "3.3G", pointIndex: 82 },
    ],
    dna: { tipo: "Cittadino", usuraGomme: "Bassa", importanzaQualifica: "Altissima", safetyCar: "8 su ultimi 10 GP", sorpassi: "Rari" }
  },
  melbourne: {
    name: "Albert Park Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Staccata di apertura, spesso caotica al via con 20 macchine.", speed: "85 km/h", g: "3.6G", pointIndex: 5 },
      { id: 2, name: "Curva 3", sector: 1, desc: "Sequenza veloce tra i platani del parco, molto tecnica.", speed: "220 km/h", g: "4.2G", pointIndex: 18 },
      { id: 3, name: "Curva 9", sector: 2, desc: "Curva lenta che immette sul lungo rettilineo, ideale per il DRS.", speed: "70 km/h", g: "2.8G", pointIndex: 42 },
      { id: 4, name: "Curva 12", sector: 2, desc: "Chicane ad alta velocità sul bordo del lago.", speed: "175 km/h", g: "3.7G", pointIndex: 60 },
      { id: 5, name: "Curva 15", sector: 3, desc: "Ultima curva lenta prima del traguardo, zona di sorpasso.", speed: "80 km/h", g: "3.0G", pointIndex: 80 },
    ],
    dna: { tipo: "Semi-cittadino", usuraGomme: "Media", importanzaQualifica: "Alta", safetyCar: "6 su ultimi 10 GP", sorpassi: "Medi" }
  },
  suzuka: {
    name: "Suzuka International Racing Course",
    corners: [
      { id: 1, name: "S Curves", sector: 1, desc: "La sequenza più iconica della F1: cambi di direzione ad altissima velocità.", speed: "255 km/h", g: "4.8G", pointIndex: 8 },
      { id: 2, name: "Degner", sector: 1, desc: "Curva cieca dopo il tunnel, richiede coraggio massimo.", speed: "165 km/h", g: "4.1G", pointIndex: 22 },
      { id: 3, name: "Hairpin", sector: 2, desc: "La curva più lenta del circuito, fondamentale per la trazione in uscita.", speed: "55 km/h", g: "2.5G", pointIndex: 42 },
      { id: 4, name: "Spoon", sector: 2, desc: "Curva a cucchiaio ad alta velocità, test estremo per il bilanciamento.", speed: "215 km/h", g: "4.6G", pointIndex: 62 },
      { id: 5, name: "130R", sector: 3, desc: "Una delle curve più veloci della F1. Leggendaria.", speed: "295 km/h", g: "5.2G", pointIndex: 80 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Alta", safetyCar: "3 su ultimi 10 GP", sorpassi: "Rari" }
  },
  shanghai: {
    name: "Shanghai International Circuit",
    corners: [
      { id: 1, name: "Curva 1-2", sector: 1, desc: "Doppia curva ad alta velocità a forma di spirale, unica al mondo.", speed: "195 km/h", g: "4.3G", pointIndex: 8 },
      { id: 2, name: "Curva 6", sector: 1, desc: "Hairpin lento dopo una lunga frenata, zona di sorpasso chiave.", speed: "65 km/h", g: "3.0G", pointIndex: 25 },
      { id: 3, name: "Curva 8", sector: 2, desc: "Curva veloce che porta sul lungo back straight.", speed: "235 km/h", g: "4.0G", pointIndex: 45 },
      { id: 4, name: "Curva 11", sector: 2, desc: "Chicane tecnica nel settore centrale.", speed: "145 km/h", g: "3.5G", pointIndex: 62 },
      { id: 5, name: "Curva 14", sector: 3, desc: "Sequenza finale prima del rettilineo del traguardo.", speed: "175 km/h", g: "3.8G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Media", importanzaQualifica: "Media", safetyCar: "4 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  miami: {
    name: "Miami International Autodrome",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima frenata pesante dopo il lancio dal rettilineo principale.", speed: "90 km/h", g: "3.7G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Sequenza tecnica attorno allo stadio Hard Rock.", speed: "145 km/h", g: "3.4G", pointIndex: 20 },
      { id: 3, name: "Curva 11", sector: 2, desc: "Chicane sul lungomare artificiale, zona di sorpasso.", speed: "95 km/h", g: "3.2G", pointIndex: 45 },
      { id: 4, name: "Curva 14", sector: 2, desc: "Curva veloce che porta al back straight.", speed: "225 km/h", g: "4.0G", pointIndex: 62 },
      { id: 5, name: "Curva 17", sector: 3, desc: "Ultima chicane, spesso teatro di contatti nelle ultime fasi.", speed: "105 km/h", g: "3.3G", pointIndex: 82 },
    ],
    dna: { tipo: "Semi-cittadino", usuraGomme: "Media", importanzaQualifica: "Alta", safetyCar: "5 su ultimi 10 GP", sorpassi: "Medi" }
  },
  imola: {
    name: "Autodromo Enzo e Dino Ferrari",
    corners: [
      { id: 1, name: "Tamburello", sector: 1, desc: "La curva più famosa d'Italia, teatro della tragedia di Senna nel 1994.", speed: "275 km/h", g: "4.6G", pointIndex: 8 },
      { id: 2, name: "Villeneuve", sector: 1, desc: "Chicane intitolata al grande Gilles, frenata brutale.", speed: "85 km/h", g: "3.9G", pointIndex: 22 },
      { id: 3, name: "Piratella", sector: 2, desc: "Curva in salita ad alta velocità, cieca e impegnativa.", speed: "195 km/h", g: "4.2G", pointIndex: 45 },
      { id: 4, name: "Acque Minerali", sector: 2, desc: "Chicane spettacolare immersa nel verde delle colline.", speed: "110 km/h", g: "3.6G", pointIndex: 62 },
      { id: 5, name: "Variante Alta", sector: 3, desc: "Ultima chicane prima della discesa verso il traguardo.", speed: "95 km/h", g: "3.4G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Bassa", importanzaQualifica: "Altissima", safetyCar: "7 su ultimi 10 GP", sorpassi: "Rarissimi" }
  },
  monaco: {
    name: "Circuit de Monaco",
    corners: [
      { id: 1, name: "Sainte Devote", sector: 1, desc: "Prima curva del GP, spesso teatro di incidenti al via.", speed: "65 km/h", g: "3.2G", pointIndex: 5 },
      { id: 2, name: "Massenet", sector: 1, desc: "Curva veloce in salita verso il Casino.", speed: "120 km/h", g: "2.8G", pointIndex: 18 },
      { id: 3, name: "Casino", sector: 2, desc: "La curva più famosa di Monaco, davanti al Casino.", speed: "75 km/h", g: "3.1G", pointIndex: 32 },
      { id: 4, name: "Tunnel", sector: 2, desc: "L'unico tunnel della F1. Da buio a luce in un secondo.", speed: "290 km/h", g: "1.2G", pointIndex: 52 },
      { id: 5, name: "Nouvelle Chicane", sector: 3, desc: "La frenata più brusca del circuito.", speed: "55 km/h", g: "3.8G", pointIndex: 65 },
      { id: 6, name: "Rascasse", sector: 3, desc: "La curva più lenta di Monaco — il 'parcheggio' di Schumacher nel 2006.", speed: "45 km/h", g: "2.5G", pointIndex: 82 },
    ],
    dna: { tipo: "Cittadino", usuraGomme: "Bassa", importanzaQualifica: "Altissima", safetyCar: "8 su ultimi 10 GP", sorpassi: "Rarissimi" }
  },
  barcelona: {
    name: "Circuit de Barcelona-Catalunya",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima frenata, sorpasso difficile ma possibile con DRS.", speed: "90 km/h", g: "3.7G", pointIndex: 5 },
      { id: 2, name: "Curva 3", sector: 1, desc: "Ramsés, curva veloce in salita che testa il bilanciamento.", speed: "195 km/h", g: "4.3G", pointIndex: 20 },
      { id: 3, name: "Curva 5", sector: 2, desc: "Sequenza tecnica nel settore centrale.", speed: "135 km/h", g: "3.5G", pointIndex: 40 },
      { id: 4, name: "Curva 9", sector: 2, desc: "Doppia destra, fondamentale per l'assetto della macchina.", speed: "175 km/h", g: "4.1G", pointIndex: 60 },
      { id: 5, name: "Curva 13", sector: 3, desc: "Chicane finale prima del lungo rettilineo.", speed: "105 km/h", g: "3.2G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Alta", safetyCar: "3 su ultimi 10 GP", sorpassi: "Rari" }
  },
  montreal: {
    name: "Circuit Gilles Villeneuve",
    corners: [
      { id: 1, name: "Virage Senna", sector: 1, desc: "Prima curva intitolata ad Ayrton Senna, frenata pesante.", speed: "85 km/h", g: "3.8G", pointIndex: 8 },
      { id: 2, name: "Epingle", sector: 1, desc: "L'hairpin più lento del circuito, sorpassi frequenti.", speed: "55 km/h", g: "2.7G", pointIndex: 25 },
      { id: 3, name: "Wall of Champions", sector: 2, desc: "La curva che ha eliminato tre campioni del mondo in un solo GP.", speed: "215 km/h", g: "4.4G", pointIndex: 48 },
      { id: 4, name: "Casino", sector: 2, desc: "Chicane tecnica vicino al casino, zona di sorpasso.", speed: "95 km/h", g: "3.3G", pointIndex: 65 },
      { id: 5, name: "Island Hairpin", sector: 3, desc: "Ultima chicane sull'isola artificiale.", speed: "70 km/h", g: "3.0G", pointIndex: 82 },
    ],
    dna: { tipo: "Semi-cittadino", usuraGomme: "Bassa", importanzaQualifica: "Bassa", safetyCar: "7 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  spielberg: {
    name: "Red Bull Ring",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Staccata in discesa dal rettilineo di partenza, zona calda al via.", speed: "90 km/h", g: "3.7G", pointIndex: 5 },
      { id: 2, name: "Curva 2", sector: 1, desc: "Curva veloce in salita dopo la prima staccata.", speed: "215 km/h", g: "4.3G", pointIndex: 18 },
      { id: 3, name: "Curva 3", sector: 2, desc: "Chicane lenta nel settore centrale, zona di sorpasso.", speed: "85 km/h", g: "3.2G", pointIndex: 40 },
      { id: 4, name: "Curva 6", sector: 2, desc: "Curva a destra veloce che porta sul rettilineo opposto.", speed: "195 km/h", g: "4.1G", pointIndex: 62 },
      { id: 5, name: "Curva 9", sector: 3, desc: "Ultima curva, frenata pesante prima del rettilineo finale.", speed: "75 km/h", g: "3.5G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Molto Alta", importanzaQualifica: "Bassa", safetyCar: "3 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  silverstone: {
    name: "Silverstone Circuit",
    corners: [
      { id: 1, name: "Copse", sector: 1, desc: "Curva ad alta velocità che apre il giro, leggendaria per il coraggio richiesto.", speed: "285 km/h", g: "5.1G", pointIndex: 8 },
      { id: 2, name: "Maggotts-Becketts", sector: 1, desc: "La sequenza di esse più rapida e impegnativa di tutta la F1.", speed: "265 km/h", g: "5.5G", pointIndex: 22 },
      { id: 3, name: "Stowe", sector: 2, desc: "Curva veloce con una delle frenate più intense del calendario.", speed: "195 km/h", g: "4.3G", pointIndex: 48 },
      { id: 4, name: "Club", sector: 2, desc: "Curva lenta che porta sul rettilineo di partenza.", speed: "115 km/h", g: "3.4G", pointIndex: 65 },
      { id: 5, name: "Abbey", sector: 3, desc: "Esse veloce all'inizio del giro, spesso ventosissima.", speed: "245 km/h", g: "4.7G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Molto Alta", importanzaQualifica: "Media", safetyCar: "4 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  budapest: {
    name: "Hungaroring",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Staccata pesante, unica zona di sorpasso del circuito.", speed: "80 km/h", g: "3.6G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Tornantino lento, richiede massima trazione in uscita.", speed: "60 km/h", g: "2.8G", pointIndex: 20 },
      { id: 3, name: "Curva 8", sector: 2, desc: "Curva ad alta velocità nella valle, poco grip storicamente.", speed: "185 km/h", g: "4.0G", pointIndex: 45 },
      { id: 4, name: "Curva 11", sector: 2, desc: "Hairpin centrale, importante per il ritmo sul giro.", speed: "55 km/h", g: "2.6G", pointIndex: 62 },
      { id: 5, name: "Curva 14", sector: 3, desc: "Sequenza finale tecnica prima del rettilineo.", speed: "155 km/h", g: "3.7G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Media", importanzaQualifica: "Altissima", safetyCar: "3 su ultimi 10 GP", sorpassi: "Rarissimi" }
  },
  spa: {
    name: "Circuit de Spa-Francorchamps",
    corners: [
      { id: 1, name: "La Source", sector: 1, desc: "Hairpin di apertura, zona di sorpasso al via.", speed: "70 km/h", g: "2.9G", pointIndex: 5 },
      { id: 2, name: "Eau Rouge - Raidillon", sector: 1, desc: "La curva più famosa della F1. Muro verso il cielo a 300 km/h.", speed: "305 km/h", g: "5.6G", pointIndex: 18 },
      { id: 3, name: "Pouhon", sector: 2, desc: "Doppia sinistra ad alta velocità, richiede enorme coraggio.", speed: "265 km/h", g: "4.9G", pointIndex: 45 },
      { id: 4, name: "Stavelot", sector: 2, desc: "Curva veloce prima del bus stop, zona rischiosa con pioggia.", speed: "235 km/h", g: "4.5G", pointIndex: 62 },
      { id: 5, name: "Bus Stop", sector: 3, desc: "Ultima chicane, sorpassi e contatti frequenti nelle ultime tornate.", speed: "85 km/h", g: "3.4G", pointIndex: 85 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Alta", safetyCar: "6 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  zandvoort: {
    name: "Circuit Zandvoort",
    corners: [
      { id: 1, name: "Tarzan", sector: 1, desc: "Hairpin di apertura, unica zona di vero sorpasso.", speed: "75 km/h", g: "3.2G", pointIndex: 5 },
      { id: 2, name: "Hugenholtzbocht", sector: 1, desc: "Curva veloce sul lato nord del circuito.", speed: "245 km/h", g: "4.6G", pointIndex: 22 },
      { id: 3, name: "Scheivlak", sector: 2, desc: "Esse tecnica nel settore centrale, grip variabile.", speed: "195 km/h", g: "4.1G", pointIndex: 45 },
      { id: 4, name: "Hugenholtz", sector: 2, desc: "Curva sopraelevata unica nel calendario — 18° di banking.", speed: "235 km/h", g: "5.8G", pointIndex: 62 },
      { id: 5, name: "Arie Luyendyk", sector: 3, desc: "Seconda curva sopraelevata, spettacolare per il pubblico.", speed: "185 km/h", g: "4.8G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Altissima", safetyCar: "4 su ultimi 10 GP", sorpassi: "Rarissimi" }
  },
  monza: {
    name: "Autodromo Nazionale Monza",
    corners: [
      { id: 1, name: "Prima Variante", sector: 1, desc: "Chicane brutale dopo il rettilineo di partenza a 350 km/h. Sorpassi frequenti.", speed: "75 km/h", g: "4.5G", pointIndex: 5 },
      { id: 2, name: "Seconda Variante", sector: 1, desc: "Seconda chicane, meno importante ma tecnica.", speed: "90 km/h", g: "3.8G", pointIndex: 20 },
      { id: 3, name: "Lesmo 1", sector: 2, desc: "Curva veloce nel bosco, asfalto sconnesso.", speed: "195 km/h", g: "4.2G", pointIndex: 42 },
      { id: 4, name: "Lesmo 2", sector: 2, desc: "Seconda Lesmo, più lenta e tecnica della prima.", speed: "175 km/h", g: "3.9G", pointIndex: 55 },
      { id: 5, name: "Parabolica", sector: 3, desc: "La curva più iconica d'Italia. Chi vince qui vince il cuore dei tifosi.", speed: "155 km/h", g: "3.7G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Bassa", importanzaQualifica: "Alta", safetyCar: "4 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  baku: {
    name: "Baku City Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima frenata in città, sorpassi possibili con il lungo rettilineo alle spalle.", speed: "85 km/h", g: "3.5G", pointIndex: 5 },
      { id: 2, name: "Curva 8", sector: 1, desc: "Chicane stretta vicino al castello medievale, 7 metri di larghezza.", speed: "60 km/h", g: "2.8G", pointIndex: 25 },
      { id: 3, name: "Curva 15", sector: 2, desc: "Curva lenta che immette sul rettilineo più lungo della F1.", speed: "70 km/h", g: "2.6G", pointIndex: 48 },
      { id: 4, name: "Curva 16", sector: 2, desc: "Staccata finale prima del mega-rettilineo da 2.2 km.", speed: "345 km/h", g: "5.2G", pointIndex: 65 },
      { id: 5, name: "Curva 20", sector: 3, desc: "Ultima curva a gomito, zona di errori famosa.", speed: "80 km/h", g: "3.1G", pointIndex: 85 },
    ],
    dna: { tipo: "Cittadino", usuraGomme: "Bassa", importanzaQualifica: "Media", safetyCar: "9 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  singapore: {
    name: "Marina Bay Street Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima curva notturna della F1, sempre piena di azione al via.", speed: "80 km/h", g: "3.4G", pointIndex: 5 },
      { id: 2, name: "Anderson Bridge", sector: 1, desc: "Stretto ponte storico, macchine a pochi centimetri dai guard rail.", speed: "145 km/h", g: "3.8G", pointIndex: 22 },
      { id: 3, name: "Curva 10", sector: 2, desc: "Hairpin lento sul lungomare illuminato.", speed: "55 km/h", g: "2.5G", pointIndex: 45 },
      { id: 4, name: "Raffles Boulevard", sector: 2, desc: "Rettilineo cittadino con chicane tecnica.", speed: "195 km/h", g: "3.9G", pointIndex: 65 },
      { id: 5, name: "Curva 23", sector: 3, desc: "Ultima curva prima del traguardo, spesso decisiva.", speed: "90 km/h", g: "3.2G", pointIndex: 85 },
    ],
    dna: { tipo: "Cittadino", usuraGomme: "Bassa", importanzaQualifica: "Altissima", safetyCar: "9 su ultimi 10 GP", sorpassi: "Rarissimi" }
  },
  austin: {
    name: "Circuit of the Americas",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Il punto più alto del circuito, cieco e adrenalinico al massimo.", speed: "75 km/h", g: "3.5G", pointIndex: 5 },
      { id: 2, name: "Esse Curves", sector: 1, desc: "Replica delle esse di Suzuka, altissima velocità.", speed: "265 km/h", g: "5.0G", pointIndex: 18 },
      { id: 3, name: "Curva 11", sector: 2, desc: "Hairpin lento in fondo al rettilineo, zona di sorpasso principale.", speed: "65 km/h", g: "3.0G", pointIndex: 45 },
      { id: 4, name: "Curva 16", sector: 2, desc: "Curva parabolica ispirata a Hockenheim.", speed: "185 km/h", g: "4.2G", pointIndex: 65 },
      { id: 5, name: "Curva 19", sector: 3, desc: "Sequenza finale veloce prima dell'ultimo rettilineo.", speed: "225 km/h", g: "4.5G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Media", safetyCar: "4 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  mexico: {
    name: "Autodromo Hermanos Rodriguez",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Staccata pesante a 2285m di altitudine, freni al limite.", speed: "80 km/h", g: "3.3G", pointIndex: 5 },
      { id: 2, name: "Esses", sector: 1, desc: "Esse veloci all'inizio del giro, l'aria rarefatta rende la macchina imprevedibile.", speed: "235 km/h", g: "4.4G", pointIndex: 20 },
      { id: 3, name: "Foro Sol", sector: 2, desc: "Lo stadio di baseball trasformato in chicane — unico al mondo.", speed: "95 km/h", g: "3.5G", pointIndex: 48 },
      { id: 4, name: "Peraltada", sector: 3, desc: "Curva sopraelevata leggendaria — ora modificata — simbolo del GP.", speed: "245 km/h", g: "5.0G", pointIndex: 75 },
      { id: 5, name: "Curva 17", sector: 3, desc: "Ultima curva prima del lungo rettilineo finale.", speed: "115 km/h", g: "3.6G", pointIndex: 85 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Bassa", importanzaQualifica: "Alta", safetyCar: "4 su ultimi 10 GP", sorpassi: "Medi" }
  },
  saopaulo: {
    name: "Autodromo Jose Carlos Pace",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Staccata in discesa all'apertura del giro, spesso caotica.", speed: "85 km/h", g: "3.6G", pointIndex: 5 },
      { id: 2, name: "Curva S", sector: 1, desc: "La famosa S di Senna, sequenza veloce e tecnica.", speed: "225 km/h", g: "4.5G", pointIndex: 20 },
      { id: 3, name: "Descida do Lago", sector: 2, desc: "Discesa veloce verso il lago, molto impegnativa.", speed: "285 km/h", g: "4.8G", pointIndex: 45 },
      { id: 4, name: "Curva do Sol", sector: 2, desc: "Curva lenta che porta sul rettilineo opposto.", speed: "95 km/h", g: "3.3G", pointIndex: 62 },
      { id: 5, name: "Mergulho", sector: 3, desc: "Tuffo finale verso il traguardo, adrenalina pura.", speed: "195 km/h", g: "4.1G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Alta", safetyCar: "6 su ultimi 10 GP", sorpassi: "Frequenti" }
  },
  lasvegas: {
    name: "Las Vegas Street Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima curva sul Las Vegas Strip, macchine a 330 km/h prima della staccata.", speed: "85 km/h", g: "3.7G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Chicane tecnica tra i casinò illuminati.", speed: "145 km/h", g: "3.4G", pointIndex: 20 },
      { id: 3, name: "Curva 11", sector: 2, desc: "Hairpin lento vicino al Sphere, il globo luminoso di Las Vegas.", speed: "65 km/h", g: "2.9G", pointIndex: 45 },
      { id: 4, name: "Curva 14", sector: 2, desc: "Rettilineo di Koval Lane, uno dei più veloci in assoluto.", speed: "340 km/h", g: "5.0G", pointIndex: 65 },
      { id: 5, name: "Curva 17", sector: 3, desc: "Ultima curva prima del rettilineo finale del Strip.", speed: "90 km/h", g: "3.2G", pointIndex: 85 },
    ],
    dna: { tipo: "Cittadino", usuraGomme: "Bassa", importanzaQualifica: "Alta", safetyCar: "5 su ultimi 10 GP", sorpassi: "Medi" }
  },
  lusail: {
    name: "Lusail International Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima frenata dopo il lungo rettilineo di partenza.", speed: "95 km/h", g: "3.8G", pointIndex: 5 },
      { id: 2, name: "Curva 4", sector: 1, desc: "Sequenza veloce che testa il carico aerodinamico.", speed: "225 km/h", g: "4.4G", pointIndex: 20 },
      { id: 3, name: "Curva 8", sector: 2, desc: "Esse tecnica nel settore centrale, grip ottimo.", speed: "185 km/h", g: "4.0G", pointIndex: 45 },
      { id: 4, name: "Curva 12", sector: 2, desc: "Hairpin lento, zona di sorpasso principale.", speed: "70 km/h", g: "3.0G", pointIndex: 65 },
      { id: 5, name: "Curva 15", sector: 3, desc: "Sequenza finale veloce prima del rettilineo.", speed: "235 km/h", g: "4.6G", pointIndex: 82 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Alta", importanzaQualifica: "Media", safetyCar: "3 su ultimi 10 GP", sorpassi: "Medi" }
  },
  abudhabi: {
    name: "Yas Marina Circuit",
    corners: [
      { id: 1, name: "Curva 1", sector: 1, desc: "Prima frenata pesante, zona di sorpasso al via.", speed: "90 km/h", g: "3.6G", pointIndex: 5 },
      { id: 2, name: "Curva 6", sector: 1, desc: "Chicane tecnica vicino all'hotel Yas Viceroy.", speed: "115 km/h", g: "3.3G", pointIndex: 22 },
      { id: 3, name: "Curva 9", sector: 2, desc: "Hairpin lento che porta sul tunnel sotto l'hotel.", speed: "60 km/h", g: "2.7G", pointIndex: 42 },
      { id: 4, name: "Curva 17", sector: 2, desc: "Sequenza veloce sul lungomare di Yas Island.", speed: "255 km/h", g: "4.5G", pointIndex: 65 },
      { id: 5, name: "Curva 21", sector: 3, desc: "Ultima curva della stagione, sempre carica di emozione.", speed: "95 km/h", g: "3.2G", pointIndex: 85 },
    ],
    dna: { tipo: "Permanente", usuraGomme: "Media", importanzaQualifica: "Alta", safetyCar: "3 su ultimi 10 GP", sorpassi: "Medi" }
  },
};

const outDir = path.join(__dirname, '..', 'assets/circuit-info');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const [key, data] of Object.entries(circuits)) {
  const filePath = path.join(outDir, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${key}.json`);
}

console.log(`\nDone — ${Object.keys(circuits).length} circuits generated.`);
