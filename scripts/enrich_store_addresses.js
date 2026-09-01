import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read initialData.js
const initialDataPath = path.resolve(__dirname, '../src/data/initialData.js');
const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

const match = initialDataContent.match(/export const INITIAL_STORES = (\[[\s\S]*?\]);\s*export/);
if (!match) {
  console.error('Could not extract INITIAL_STORES');
  process.exit(1);
}

let stores = eval(match[1]);

// Known Brazilian shopping malls, airports & high-traffic Spoleto landmarks dictionary
const KNOWN_LANDMARKS_CEPS = {
  // Aeroportos
  'AEROPORTO GUARULHOS': { cep: '07190-100', address: 'Rodovia Hélio Smidt, s/n - Cumbica (Aeroporto Internacional de Guarulhos)' },
  'AEROPORTO CONGONHAS': { cep: '04626-911', address: 'Avenida Washington Luís, s/n - Vila Congonhas (Aeroporto de Congonhas)' },
  'AEROPORTO BRASILIA': { cep: '71608-900', address: 'Área Especial s/n - Lago Sul (Aeroporto Internacional de Brasília)' },
  'AEROPORTO SANTOS DUMONT': { cep: '20021-340', address: 'Praça Senador Salgado Filho, s/n - Centro (Aeroporto Santos Dumont)' },
  'AEROPORTO GALEAO': { cep: '21941-900', address: 'Avenida Vinte de Janeiro, s/n - Ilha do Governador (Aeroporto do Galeão)' },
  'AEROPORTO VIRACOPOS': { cep: '13055-900', address: 'Rodovia Santos Dumont, km 66 - Parque Viracopos (Aeroporto de Viracopos)' },
  'AEROPORTO SALVADOR': { cep: '41500-570', address: 'Praça Gago Coutinho, s/n - São Cristóvão (Aeroporto de Salvador)' },
  'AEROPORTO CONFINS': { cep: '33500-000', address: 'Rodovia LMG-800, km 7,9 - Confins (Aeroporto Internacional de Belo Horizonte)' },
  'AEROPORTO CURITIBA': { cep: '83010-900', address: 'Avenida Rocha Pombo, s/n - Águas Belas (Aeroporto Afonso Pena)' },
  'AEROPORTO PORTO ALEGRE': { cep: '90200-310', address: 'Avenida Severo Dullius, 90010 - São João (Aeroporto Salgado Filho)' },
  'AEROPORTO RECIFE': { cep: '51210-902', address: 'Praça Ministro Salgado Filho, s/n - Imbiribeira (Aeroporto Internacional do Recife)' },
  'AEROPORTO FORTALEZA': { cep: '60541-704', address: 'Avenida Senador Carlos Jereissati, 3000 - Serrinha (Aeroporto de Fortaleza)' },
  'AEROPORTO VITORIA': { cep: '29075-920', address: 'Avenida Roza Helena Schorling Albuquerque, s/n - Aeroporto (Aeroporto de Vitória)' },
  'AEROPORTO GOIANIA': { cep: '74672-900', address: 'Alameda 4, s/n - Santa Genoveva (Aeroporto de Goiânia)' },
  'AEROPORTO CUIABA': { cep: '78110-900', address: 'Avenida Governador João Ponce de Arruda, s/n - Jardim Aeroporto (Aeroporto Marechal Rondon)' },
  'AEROPORTO MANAUS': { cep: '69041-000', address: 'Avenida Santos Dumont, 1350 - Tarumã (Aeroporto Internacional de Manaus)' },
  'AEROPORTO BELEM': { cep: '66115-970', address: 'Avenida Júlio César, s/n - Val-de-Cans (Aeroporto Internacional de Belém)' },
  'AEROPORTO FLORIANOPOLIS': { cep: '88047-900', address: 'Rodovia Acesso ao Aeroporto, 6200 - Carianos (Aeroporto Internacional de Florianópolis)' },
  'AEROPORTO NATAL': { cep: '59290-000', address: 'Avenida Ruy Pereira dos Santos, 3100 - São Gonçalo do Amarante (Aeroporto de Natal)' },
  'AEROPORTO JOAO PESSOA': { cep: '58308-901', address: 'Avenida Marechal Rondon, s/n - Aeroporto (Aeroporto Castro Pinto)' },
  'AEROPORTO MACEIO': { cep: '57100-000', address: 'Rodovia BR-104, km 91 - Tabuleiro do Pinto (Aeroporto Zumbi dos Palmares)' },

  // Grandes Shoppings & Outlets
  'OUTLET CATARINA FASHION': { cep: '18130-970', address: 'Rodovia Castello Branco, km 60 - Dona Catarina (Catarina Fashion Outlet)' },
  'SHOPPING IGUATEMI ESPLANADA': { cep: '18048-110', address: 'Avenida Professora Izoraida Marques Peres, 401 - Parque Campolim (Iguatemi Esplanada)' },
  'VINHEDO OPEN MALL': { cep: '13280-000', address: 'Avenida Independência, 5800 - Vinhedo (Vinhedo Open Mall)' },
  'SERRA SUL MM': { cep: '37550-000', address: 'Rodovia Juscelino Kubitschek de Oliveira, km 107 - Pouso Alegre (Serra Sul Shopping)' },
  'SERRA SUL': { cep: '37550-000', address: 'Rodovia Juscelino Kubitschek de Oliveira, km 107 - Pouso Alegre (Serra Sul Shopping)' },
  'BARRA SHOPPING': { cep: '22640-100', address: 'Avenida das Américas, 4666 - Barra da Tijuca (BarraShopping)' },
  'SHOPPING ELDORADO': { cep: '05425-070', address: 'Avenida Rebouças, 3970 - Pinheiros (Shopping Eldorado)' },
  'MORUMBI SHOPPING': { cep: '04707-900', address: 'Avenida Roque Petroni Júnior, 1089 - Jardim das Acácias (MorumbiShopping)' },
  'SHOPPING IGUATEMI SAO PAULO': { cep: '01451-000', address: 'Avenida Brigadeiro Faria Lima, 2232 - Jardim Paulistano (Shopping Iguatemi São Paulo)' },
  'SHOPPING ANALIA FRANCO': { cep: '03337-000', address: 'Avenida Regente Feijó, 1739 - Tatuapé (Shopping Anália Franco)' },
  'SHOPPING CENTER NORTE': { cep: '02089-900', address: 'Travessa Casalbuono, 120 - Vila Guilherme (Shopping Center Norte)' },
  'SHOPPING VILA OLIMPIA': { cep: '04551-000', address: 'Rua Olimpíadas, 360 - Vila Olímpia (Shopping Vila Olímpia)' },
  'SHOPPING IBIRAPUERA': { cep: '04523-900', address: 'Avenida Ibirapuera, 3103 - Indianópolis (Shopping Ibirapuera)' },
  'SHOPPING PATIO PAULISTA': { cep: '01323-001', address: 'Rua Treze de Maio, 1947 - Bela Vista (Pátio Paulista)' },
  'SHOPPING PATIO HIGIENOPOLIS': { cep: '01238-010', address: 'Avenida Higienópolis, 618 - Higienópolis (Pátio Higienópolis)' },
  'SHOPPING BOURBON': { cep: '05005-000', address: 'Rua Palestra Itália, 500 - Perdizes (Bourbon Shopping)' },
  'SHOPPING METRO SANTA CRUZ': { cep: '04037-003', address: 'Rua Domingos de Morais, 2564 - Vila Mariana (Shopping Metrô Santa Cruz)' },
  'SHOPPING METRO TATUAPE': { cep: '03086-000', address: 'Rua Melo Freire, s/n - Tatuapé (Shopping Metrô Tatuapé)' },
  'SHOPPING METRO ITAQUERA': { cep: '08220-380', address: 'Avenida José Pinheiro Borges, s/n - Itaquera (Shopping Metrô Itaquera)' },
  'SHOPPING TIETE PLAZA': { cep: '02910-000', address: 'Avenida Raimundo Pereira de Magalhães, 1465 - Jardim Iris (Tietê Plaza Shopping)' },
  'SHOPPING PLAZA SUL': { cep: '04153-000', address: 'Praça Leonor Kaupa, 100 - Jardim da Saúde (Shopping Plaza Sul)' },
  'SHOPPING TAMBORE': { cep: '06460-000', address: 'Avenida Piracema, 669 - Tamboré (Shopping Tamboré)' },
  'SHOPPING IGUATEMI ALPHAVILLE': { cep: '06455-000', address: 'Alameda Rio Negro, 111 - Alphaville (Iguatemi Alphaville)' },
  'SHOPPING ABC': { cep: '09040-310', address: 'Avenida Pereira Barreto, 42 - Vila Gilda (Shopping ABC)' },
  'GRAND PLAZA SHOPPING': { cep: '09080-510', address: 'Avenida Industrial, 600 - Jardim (Grand Plaza Shopping)' },
  'SHOPPING PRACA DA MOÇA': { cep: '09910-720', address: 'Rua Manoel da Nóbrega, 712 - Centro (Shopping Praça da Moça)' },
  'GOLDEN SQUARE SHOPPING': { cep: '09751-000', address: 'Avenida Kennedy, 700 - Jardim do Mar (Golden Square Shopping)' },
  'SHOPPING SAO BERNARDO PLAZA': { cep: '09781-220', address: 'Avenida Rotary, 624 - Ferrazópolis (São Bernardo Plaza Shopping)' },
  'SHOPPING PARK SAO CAETANO': { cep: '09531-190', address: 'Alameda Terracota, 545 - Cerâmica (ParkShopping São Caetano)' },
  'SHOPPING UNIAO DE OSASCO': { cep: '06018-018', address: 'Avenida dos Autonomistas, 1400 - Vila Yara (Shopping União de Osasco)' },
  'SUPER SHOPPING OSASCO': { cep: '06018-015', address: 'Avenida dos Autonomistas, 1765 - Vila Yara (SuperShopping Osasco)' },
  'SHOPPING INTERLAGOS': { cep: '04696-000', address: 'Avenida Interlagos, 2255 - Jardim Interlagos (Shopping Interlagos)' },
  'SP MARKET': { cep: '04691-000', address: 'Avenida das Nações Unidas, 22540 - Jurubatuba (Shopping SP Market)' },
  'CENTRAL PLAZA SHOPPING': { cep: '03153-002', address: 'Avenida Doutor Francisco Mesquita, 1000 - Jardim Ibitirama (Central Plaza Shopping)' },
  'MOOCA PLAZA SHOPPING': { cep: '03106-010', address: 'Rua Capitão Pacheco e Chaves, 313 - Mooca (Mooca Plaza Shopping)' },
  'SHOPPING METRO TUCURUVI': { cep: '02305-000', address: 'Avenida Doutor Antonio Maria Laet, 566 - Parada Inglesa (Shopping Metrô Tucuruvi)' },
  'CANTAREIRA NORTE SHOPPING': { cep: '02998-050', address: 'Avenida Raimundo Pereira de Magalhães, 11001 - Jardim Pirituba (Cantareira Norte Shopping)' },
  'SHOPPING D': { cep: '01109-010', address: 'Avenida Cruzeiro do Sul, 1100 - Canindé (Shopping D)' },
  'SHOPPING PENHA': { cep: '03632-000', address: 'Rua Doutor João Ribeiro, 304 - Penha (Shopping Penha)' },
  'SHOPPING ARICANDUVA': { cep: '03527-900', address: 'Avenida Aricanduva, 5555 - Vila Matilde (Centro Comercial Leste Aricanduva)' },
  'SHOPPING CAMPO LIMPO': { cep: '05786-080', address: 'Estrada do Campo Limpo, 459 - Vila Prel (Shopping Campo Limpo)' },
  'SHOPPING JARDIM SUL': { cep: '05716-090', address: 'Rua Itacaiúna, 61 - Vila Andrade (Shopping Jardim Sul)' },
  'MORUMBI TOWN SHOPPING': { cep: '05716-150', address: 'Avenida Giovanni Gronchi, 5930 - Vila Andrade (Morumbi Town Shopping)' },
  'SHOPPING VILA VELHA': { cep: '29107-900', address: 'Avenida Luciano das Neves, 2418 - Divino Espírito Santo (Shopping Vila Velha)' },
  'SHOPPING VITORIA': { cep: '29050-902', address: 'Avenida Américo Buaiz, 200 - Enseada do Suá (Shopping Vitória)' },
  'SHOPPING PRAIA DA COSTA': { cep: '29101-900', address: 'Avenida Doutor Olivio Lira, 353 - Praia da Costa (Shopping Praia da Costa)' },
  'SHOPPING MOXUARA': { cep: '29144-000', address: 'Rodovia BR-262, km 5 - Campo Grande (Shopping Moxuara)' },
  'RIOMAR SHOPPING FORTALEZA': { cep: '60175-055', address: 'Rua Desembargador Lauro Nogueira, 1500 - Papicu (RioMar Fortaleza)' },
  'IGUATEMI BOSQUE FORTALEZA': { cep: '60810-650', address: 'Avenida Washington Soares, 85 - Edson Queiroz (Iguatemi Bosque)' },
  'NORTH SHOPPING FORTALEZA': { cep: '60325-004', address: 'Avenida Bezerra de Menezes, 2450 - São Gerardo (North Shopping Fortaleza)' },
  'SHOPPING RIOMAR KENNEDY': { cep: '60355-630', address: 'Avenida Sargento Hermínio Sampaio, 3100 - Presidente Kennedy (RioMar Kennedy)' },
  'SALVADOR SHOPPING': { cep: '41820-021', address: 'Avenida Tancredo Neves, 3133 - Caminho das Árvores (Salvador Shopping)' },
  'SHOPPING DA BAHIA': { cep: '41820-900', address: 'Avenida Tancredo Neves, 148 - Caminho das Árvores (Shopping da Bahia)' },
  'SHOPPING BARRA SALVADOR': { cep: '40140-902', address: 'Avenida Centenário, 2992 - Chame-Chame (Shopping Barra)' },
  'PARQUE SHOPPING BAHIA': { cep: '42702-400', address: 'Rua Maria Isabel dos Santos, s/n - Centro (Parque Shopping Bahia)' },
  'BOULEVARD SHOPPING FEIRA': { cep: '44050-900', address: 'Avenida João Durval Carneiro, 3665 - São João (Boulevard Shopping Feira)' },
  'PARQUE SHOPPING MACEIO': { cep: '57038-000', address: 'Avenida Comendador Gustavo Paiva, 5945 - Cruz das Almas (Parque Shopping Maceió)' },
  'MACEIO SHOPPING': { cep: '57035-900', address: 'Avenida Comendador Gustavo Paiva, 2990 - Mangabeiras (Maceió Shopping)' },
  'MANAUARA SHOPPING': { cep: '69057-002', address: 'Avenida Mário Ypiranga, 1300 - Adrianópolis (Manauara Shopping)' },
  'AMAZONAS SHOPPING': { cep: '69050-010', address: 'Avenida Djalma Batista, 482 - Parque 10 de Novembro (Amazonas Shopping)' },
  'SUMAUMA PARK SHOPPING': { cep: '69090-001', address: 'Avenida Noel Nutels, 1762 - Cidade Nova (Sumaúma Park Shopping)' },
  'SHOPPING PATIO BELEM': { cep: '66025-005', address: 'Travessa Padre Eutíquio, 1078 - Batista Campos (Shopping Pátio Belém)' },
  'BOULEVARD SHOPPING BELEM': { cep: '66053-000', address: 'Avenida Visconde de Souza Franco, 776 - Reduto (Boulevard Shopping Belém)' },
  'PARQUE SHOPPING BELEM': { cep: '66635-110', address: 'Rodovia Augusto Montenegro, 4300 - Parque Verde (Parque Shopping Belém)' },
  'PARK SHOPPING BRASILIA': { cep: '71219-900', address: 'SMAS Trecho 1 - Guará (ParkShopping Brasília)' },
  'BRASILIA SHOPPING': { cep: '70715-900', address: 'SCN Quadra 5 Bloco A - Asa Norte (Brasília Shopping)' },
  'PATIO BRASIL SHOPPING': { cep: '70307-902', address: 'SCS Quadra 7 Bloco A - Asa Sul (Pátio Brasil Shopping)' },
  'TAGUATINGA SHOPPING': { cep: '72015-597', address: 'QS 1 Rua 210, Lote 40 - Águas Claras (Taguatinga Shopping)' },
  'JK SHOPPING': { cep: '72140-515', address: 'Avenida Hélio Prates, QNM 34 - Taguatinga Norte (JK Shopping)' },
  'CONJUNTO NACIONAL BRASILIA': { cep: '70077-900', address: 'SDN CNB - Asa Norte (Shopping Conjunto Nacional)' },
  'TERRACO SHOPPING': { cep: '70660-000', address: 'SHCES Quadra 201 Lote 1 - Cruzeiro Novo (Terraço Shopping)' },
  'FLAMBOYANT SHOPPING': { cep: '74810-907', address: 'Avenida Deputado Jamel Cecílio, 3300 - Jardim Goiás (Flamboyant Shopping Center)' },
  'GOIANIA SHOPPING': { cep: '74230-030', address: 'Avenida T-10, 1300 - Setor Bueno (Goiânia Shopping)' },
  'BURITI SHOPPING': { cep: '74915-440', address: 'Avenida Rio Verde, Quadra 102 - Vila São Tomaz (Buriti Shopping)' },
  'PANTANAL SHOPPING': { cep: '78050-970', address: 'Avenida Historiador Rubens de Mendonça, 3300 - Jardim Aclimação (Pantanal Shopping)' },
  'SHOPPING ESTACAO CUIABA': { cep: '78043-000', address: 'Avenida Miguel Sutil, 9300 - Santa Rosa (Shopping Estação Cuiabá)' },
  'SHOPPING CAMPO GRANDE': { cep: '79021-000', address: 'Avenida Afonso Pena, 4909 - Santa Fé (Shopping Campo Grande)' },
  'NORTE SUL PLAZA': { cep: '79008-010', address: 'Avenida Ernesto Geisel, 2300 - Jockey Club (Norte Sul Plaza)' },
  'MIDWAY MALL': { cep: '59015-900', address: 'Avenida Bernardo Vieira, 3775 - Tirol (Midway Mall)' },
  'NATAL SHOPPING': { cep: '59064-900', address: 'Avenida Senador Salgado Filho, 2234 - Candelária (Natal Shopping)' },
  'PRAIA SHOPPING': { cep: '59092-200', address: 'Avenida Engenheiro Roberto Freire, 3132 - Ponta Negra (Praia Shopping)' },
  'PARTAGE SHOPPING MOSSORO': { cep: '59607-330', address: 'Avenida João da Escóssia, 1515 - Nova Betânia (Partage Shopping Mossoró)' }
};

// Fetch official data from ViaCEP
async function fetchViaCepData(cepClean) {
  if (!cepClean || cepClean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: data.cep,
      state: data.uf,
      city: data.localidade,
      neighborhood: data.bairro || '',
      street: data.logradouro || '',
      fullAddress: [data.logradouro, data.bairro].filter(Boolean).join(', ')
    };
  } catch (err) {
    return null;
  }
}

async function findPostcodeByGeocoding(query) {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SpoletoRadarBatchAddress/2.0 (contact: info@spoleto.com.br)'
      }
    });
    if (!res.ok) return null;
    const list = await res.json();
    if (!list || list.length === 0) return null;

    const item = list[0];
    const postcode = item.address?.postcode;
    const road = item.address?.road || item.address?.pedestrian || item.address?.street;
    const houseNumber = item.address?.house_number || '';
    const suburb = item.address?.suburb || item.address?.neighbourhood || '';

    return {
      postcode: postcode ? postcode.replace(/\D/g, '') : null,
      road,
      houseNumber,
      suburb,
      displayName: item.display_name
    };
  } catch (err) {
    return null;
  }
}

async function runEnrichmentFull() {
  console.log(`\n🚀 INICIANDO ENRIQUECIMENTO COMPLETO DAS 409 LOJAS DA REDE SPOLETO...`);

  const enrichedStores = [];
  let successCount = 0;

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    let rawName = (store.name || '').replace(/^SPOLETO\s+/i, '').replace(/^SPO\s*-\s*/i, '').trim();
    let cleanPlace = rawName.replace(/\s*\(.*?\)/g, '').replace(/\s*-\s*LOJA.*$/i, '').trim();
    let upperClean = cleanPlace.toUpperCase();

    let resolvedCep = null;
    let resolvedAddress = null;
    let resolvedCity = store.city;
    let resolvedState = store.state;

    // 1. Verificar no dicionário de marcos conhecidos / Shoppings
    for (const [key, val] of Object.entries(KNOWN_LANDMARKS_CEPS)) {
      if (upperClean.includes(key) || key.includes(upperClean)) {
        resolvedCep = val.cep;
        resolvedAddress = val.address;
        break;
      }
    }

    // 2. Se não encontrou no dicionário, buscar no Nominatim
    if (!resolvedCep) {
      const query = `${cleanPlace} ${store.city} ${store.state}`.trim();
      const geo = await findPostcodeByGeocoding(query);
      if (geo && geo.postcode && geo.postcode.length === 8) {
        const viacep = await fetchViaCepData(geo.postcode);
        if (viacep) {
          resolvedCep = viacep.cep;
          resolvedCity = viacep.city || store.city;
          resolvedState = viacep.state || store.state;
          const streetPart = viacep.street ? `${viacep.street}${geo.houseNumber ? `, ${geo.houseNumber}` : ''}` : cleanPlace;
          const neighborhoodPart = viacep.neighborhood ? ` - ${viacep.neighborhood}` : '';
          resolvedAddress = `${streetPart}${neighborhoodPart} (${cleanPlace})`.trim();
        }
      }
      await new Promise(r => setTimeout(r, 600)); // Rate limit
    }

    // 3. Se ainda não encontrou e for shopping, tentar com prefixo Shopping
    if (!resolvedCep && store.locationType === 'Shopping') {
      const geoShop = await findPostcodeByGeocoding(`Shopping ${cleanPlace} ${store.city} ${store.state}`);
      if (geoShop && geoShop.postcode && geoShop.postcode.length === 8) {
        const viacep = await fetchViaCepData(geoShop.postcode);
        if (viacep) {
          resolvedCep = viacep.cep;
          resolvedCity = viacep.city || store.city;
          resolvedState = viacep.state || store.state;
          const streetPart = viacep.street ? `${viacep.street}${geoShop.houseNumber ? `, ${geoShop.houseNumber}` : ''}` : cleanPlace;
          const neighborhoodPart = viacep.neighborhood ? ` - ${viacep.neighborhood}` : '';
          resolvedAddress = `${streetPart}${neighborhoodPart} (${cleanPlace})`.trim();
        }
      }
      await new Promise(r => setTimeout(r, 600));
    }

    // 4. Se encontrou CEP via ViaCEP sem endereço customizado
    if (resolvedCep && !resolvedAddress) {
      const viacep = await fetchViaCepData(resolvedCep.replace(/\D/g, ''));
      if (viacep) {
        resolvedCity = viacep.city || store.city;
        resolvedState = viacep.state || store.state;
        const streetPart = viacep.street || cleanPlace;
        const neighborhoodPart = viacep.neighborhood ? ` - ${viacep.neighborhood}` : '';
        resolvedAddress = `${streetPart}${neighborhoodPart} (${cleanPlace})`.trim();
      }
    }

    if (resolvedCep) {
      successCount++;
      enrichedStores.push({
        ...store,
        cep: resolvedCep,
        city: resolvedCity,
        state: resolvedState,
        address: resolvedAddress || `${cleanPlace} - ${resolvedCity}/${resolvedState}`,
        enriched: true
      });
      console.log(`[${i + 1}/${stores.length}] ✅ [${store.code}] ${store.name} -> CEP: ${resolvedCep} | ${resolvedAddress}`);
    } else {
      enrichedStores.push({
        ...store,
        cep: store.cep || '01000-000',
        city: store.city,
        state: store.state,
        address: store.address || `${cleanPlace} - ${store.city}/${store.state}`,
        enriched: false
      });
      console.log(`[${i + 1}/${stores.length}] ℹ️ [${store.code}] ${store.name} (${store.city}/${store.state})`);
    }
  }

  console.log(`\n🎉 ENRIQUECIMENTO CONCLUÍDO COM SUCESSO!`);
  console.log(`✅ Lojas com CEP & Endereço Completo: ${successCount} / ${stores.length} (${Math.round((successCount / stores.length) * 100)}%)`);

  // Salvar no initialData.js
  let updatedInitialData = initialDataContent.replace(
    /export const INITIAL_STORES = \[[\s\S]*?\];\s*export const INITIAL_VISITS/,
    `export const INITIAL_STORES = ${JSON.stringify(enrichedStores, null, 2)};\n\nexport const INITIAL_VISITS`
  );
  fs.writeFileSync(initialDataPath, updatedInitialData, 'utf8');
  console.log(`💾 src/data/initialData.js atualizado com os novos CEPs e endereços.`);

  // Gerar SQL completo para o Supabase
  let sql = `-- =========================================================================\n`;
  sql += `-- SCRIPT DE ATUALIZAÇÃO OFICIAL DE CEPS E ENDEREÇOS - REDE SPOLETO\n`;
  sql += `-- Total de Lojas Enriquecidas: ${enrichedStores.length}\n`;
  sql += `-- =========================================================================\n\n`;

  enrichedStores.forEach(s => {
    const escAddress = (s.address || '').replace(/'/g, "''");
    const escCity = (s.city || '').replace(/'/g, "''");
    sql += `UPDATE public.stores SET cep = '${s.cep || ''}', city = '${escCity}', state = '${s.state}', address = '${escAddress}' WHERE id = '${s.id}' OR code = '${s.code}';\n`;
  });

  const sqlPath = path.resolve(__dirname, '../supabase_enrich_addresses.sql');
  fs.writeFileSync(sqlPath, sql, 'utf8');
  console.log(`💾 Arquivo SQL gerado em: ${sqlPath}`);

  // Sincronizar diretamente com o Supabase
  try {
    const supabase = createClient(
      'https://axcabkqjojhaxfltebgu.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI'
    );

    console.log(`\n📡 Sincronizando ${enrichedStores.length} lojas diretamente com o Supabase...`);
    const updates = enrichedStores.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      city: s.city,
      state: s.state,
      cep: s.cep,
      address: s.address,
      location_type: s.locationType || s.location_type || 'Shopping',
      consultant_id: s.consultantId || s.consultant_id,
      rating_score: s.ratingScore || s.rating_score || 8.5,
      status: s.status || 'Ativa'
    }));

    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      const { error } = await supabase.from('stores').upsert(chunk);
      if (error) {
        console.error(`Erro no lote ${i}:`, error.message);
      } else {
        console.log(`✅ Lote ${i + 1} a ${Math.min(i + 50, updates.length)} atualizado no Supabase.`);
      }
    }
    console.log(`🎉 Supabase sincronizado com sucesso!`);
  } catch (err) {
    console.error('Erro na sincronização direta:', err.message);
  }
}

runEnrichmentFull();
