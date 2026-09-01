// Serviço de Cidades Oficiais do Brasil (IBGE) e Busca Automática de CEP (ViaCEP)

export const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' }
];

// Fallback das principais cidades por estado (caso API offline)
export const FALLBACK_CITIES_BY_UF = {
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'São José dos Campos', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'São José do Rio Preto', 'Piracicaba', 'Bauru', 'Jundiaí', 'Franca', 'Barueri', 'Taubaté', 'Praia Grande', 'Limeira', 'Suzano', 'Taboão da Serra', 'Sumaré', 'Embu das Artes', 'São Carlos', 'Indaiatuba', 'Cotia', 'Americana', 'Itapevi', 'Araraquara', 'Jacareí', 'Hortolândia', 'Presidente Prudente', 'Rio Claro'],
  RJ: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis', 'Volta Redonda', 'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis', 'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita', 'Nilópolis', 'Maricá', 'Rio das Ostras', 'Queimados', 'Resende', 'Araruama'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará', 'Varginha', 'Conselheiro Lafaiete', 'Araguari', 'Itabira'],
  DF: [
    'Brasília (Plano Piloto)',
    'Águas Claras',
    'Taguatinga',
    'Ceilândia',
    'Samambaia',
    'Guará',
    'Gama',
    'Sudoeste / Octogonal',
    'Asa Sul',
    'Asa Norte',
    'Noroeste',
    'Sobradinho',
    'Sobradinho II',
    'Planaltina',
    'Vicente Pires',
    'Cruzeiro',
    'Lago Sul',
    'Lago Norte',
    'Núcleo Bandeirante',
    'Santa Maria',
    'Recanto das Emas',
    'Riacho Fundo I',
    'Riacho Fundo II',
    'São Sebastião',
    'Jardim Botânico',
    'Paranoá',
    'Itapoã',
    'Brazlândia',
    'Candangolândia',
    'Park Way',
    'Arniqueira',
    'Sol Nascente / Pôr do Sol',
    'Estrutural / SCIA',
    'SIA (Setor de Indústria e Abastecimento)',
    'Varjão',
    'Fercal',
    'Arapoanga'
  ],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo', 'Arapongas', 'Almirante Tamandaré', 'Umuarama', 'Piraquara', 'Cambé'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul', 'Cachoeirinha', 'Bento Gonçalves', 'Bagé', 'Erechim', 'Guaíba'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas', 'Alagoinhas', 'Porto Seguro', 'Barreiras', 'Simões Filho', 'Paulo Afonso', 'Eunápolis', 'Santo Antônio de Jesus', 'Valença'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó', 'Itajaí', 'Jaraguá do Sul', 'Lages', 'Palhoça', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador', 'Camboriú', 'Navegantes', 'Concórdia'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Senador Canedo', 'Itumbiara', 'Catalão', 'Jataí', 'Planaltina', 'Caldas Novas', 'Santo Antônio do Descoberto'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima', 'Ipojuca'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Pacatuba', 'Aquiraz', 'Quixeramobim', 'Canindé', 'Tianguá', 'Russas', 'Crateús'],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'São Félix do Xingu', 'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas', 'Tailândia', 'Breves'],
  ES: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Guarapari', 'Colatina', 'Aracruz', 'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Marataízes'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças', 'Cáceres', 'Nova Mutum', 'Campo Novo do Parecis'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba', 'Maracaju', 'Amambai'],
  MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Barra do Corda', 'Pinheiro'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Ceará-Mirim', 'Macaíba', 'Caicó', 'Açu', 'Currais Novos', 'São José de Mipibu', 'Santa Cruz', 'Nova Cruz'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape', 'Queimadas', 'Pombal'],
  AL: ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'Penedo', 'São Miguel dos Campos', 'Campo Alegre', 'Coruripe', 'Marechal Deodoro', 'Delmiro Gouveia'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Barras', 'Campo Maior', 'União', 'Altos', 'Esperantina', 'José de Freitas', 'Pedro II'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias', 'Itabaianinha', 'Poço Redondo'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tabatinga', 'Maués', 'Tefé', 'Manicoré', 'Humaitá', 'Iranduba'],
  RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Machadinho d\'Oeste'],
  TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Araguatins', 'Colinas do Tocantins', 'Guaraí'],
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia', 'Senador Guiomard', 'Plácido de Castro'],
  AP: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande', 'Mazagão', 'Tartarugalzinho'],
  RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá', 'Mucajaí', 'Alto Alegre']
};

// Cache de cidades consultadas via IBGE API
const ibgeCityCache = {};

/**
 * Formata CEP no padrão brasileiro: 00000-000
 */
export function formatCEP(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Busca dados de endereço completo via ViaCEP
 */
export async function fetchAddressByCEP(rawCep) {
  const clean = (rawCep || '').replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: formatCEP(data.cep || clean),
      state: data.uf,
      city: data.localidade,
      neighborhood: data.bairro || '',
      street: data.logradouro || '',
      fullAddress: [data.logradouro, data.bairro].filter(Boolean).join(', ')
    };
  } catch (err) {
    console.warn('ViaCEP offline or timed out, continuing:', err);
    return null;
  }
}

/**
 * Busca CEP e endereços correspondentes a partir do nome da rua, shopping ou bairro via ViaCEP
 */
export async function searchCepByText(uf, city, text) {
  if (!uf || !city || !text) return [];
  const cleanText = text
    .replace(/spoleto/gi, '')
    .replace(/shopping/gi, '')
    .replace(/[^\w\s]/gi, '')
    .trim();
  const query = cleanText.length >= 3 ? cleanText : text.replace(/[^\w\s]/gi, '').trim();
  if (query.length < 3) return [];

  // Normalizar acentos
  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanCity = encodeURIComponent(normalize(city).trim());
  const cleanUF = encodeURIComponent(uf.toUpperCase().trim());
  const cleanQuery = encodeURIComponent(normalize(query).trim());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://viacep.com.br/ws/${cleanUF}/${cleanCity}/${cleanQuery}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      cep: formatCEP(item.cep),
      state: item.uf,
      city: item.localidade,
      neighborhood: item.bairro || '',
      street: item.logradouro || '',
      fullAddress: [item.logradouro, item.bairro].filter(Boolean).join(', ')
    }));
  } catch (err) {
    console.warn('ViaCEP search by text offline or error:', err);
    return [];
  }
}

/**
 * Busca todas as cidades oficiais de um estado (IBGE API com cache e fallback)
 */
export async function getCitiesForState(uf) {
  if (!uf) return [];
  const upperUF = uf.toUpperCase();

  // Para o Distrito Federal, retornar sempre todas as 37 Regiões Administrativas / Cidades Satélites
  if (upperUF === 'DF') {
    const dfCities = [...FALLBACK_CITIES_BY_UF.DF].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    ibgeCityCache.DF = dfCities;
    return dfCities;
  }

  if (ibgeCityCache[upperUF] && ibgeCityCache[upperUF].length > 0) {
    return ibgeCityCache[upperUF];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${upperUF}/municipios?orderBy=nome`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cityNames = data.map(item => item.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        ibgeCityCache[upperUF] = cityNames;
        return cityNames;
      }
    }
  } catch (err) {
    console.warn('IBGE municipios offline, using fallback list:', err);
  }

  const fallback = (FALLBACK_CITIES_BY_UF[upperUF] || []).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  ibgeCityCache[upperUF] = fallback;
  return fallback;
}
