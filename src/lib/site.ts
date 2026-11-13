export const base = '/Whipper-IdleRPG';
export const site = 'https://jaymcarthur.github.io';
export const localeCodes = ['en', 'ja', 'zh-cn', 'ko', 'zh-tw', 'es', 'th', 'pt', 'de', 'fr'] as const;
export type Locale = typeof localeCodes[number];
export const languages: Record<Locale, { name: string; column: string; html: string }> = {
  en: { name: 'English', column: 'en_US', html: 'en' },
  ja: { name: '日本語', column: 'ja_JP', html: 'ja' },
  'zh-cn': { name: '简体中文', column: 'zh_CN', html: 'zh-Hans' },
  ko: { name: '한국어', column: 'ko', html: 'ko' },
  'zh-tw': { name: '繁體中文', column: 'zh_TW', html: 'zh-Hant' },
  es: { name: 'Español', column: 'es', html: 'es' },
  th: { name: 'ไทย', column: 'th', html: 'th' },
  pt: { name: 'Português', column: 'pt', html: 'pt' },
  de: { name: 'Deutsch', column: 'de', html: 'de' },
  fr: { name: 'Français', column: 'fr', html: 'fr' },
};
export function href(locale: Locale, path = '') {
  return `${base}/${locale}/${path ? `${path.replace(/^\/|\/$/g, '')}/` : ''}`;
}
export function asset(path: string) { return `${base}/${path}`; }

const index: Record<Locale, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> = {
  en: 0, ja: 1, 'zh-cn': 2, ko: 3, 'zh-tw': 4, es: 5, th: 6, pt: 7, de: 8, fr: 9,
};
const text = {
  specialization: ['Specialization', '特化', '专精', '특화', '專精', 'Especialización', 'ความเชี่ยวชาญ', 'Especialização', 'Spezialisierung', 'Spécialisation'],
  laterAbility: ['Later ability', '上位能力', '后续能力', '후속 능력', '後續能力', 'Habilidad posterior', 'ความสามารถถัดไป', 'Habilidade posterior', 'Spätere Fähigkeit', 'Talent ultérieur'],
  floorCount: ['Base floor count', '基礎階層数', '基础层数', '기본 층수', '基礎層數', 'Pisos base', 'จำนวนชั้นพื้นฐาน', 'Andares base', 'Grundanzahl Ebenen', 'Nombre d’étages de base'],
  encounterGroups: ['Encounter groups', '出現グループ', '遭遇组', '조우 그룹', '遭遇群組', 'Grupos de encuentros', 'กลุ่มการเผชิญหน้า', 'Grupos de encontros', 'Begegnungsgruppen', 'Groupes de rencontres'],
  heroLead: ['Small steps.', '少しずつ、', '一步一步，', '작은 발걸음으로,', '一步一步，', 'Paso a paso.', 'ก้าวทีละน้อย', 'Passo a passo.', 'Schritt für Schritt.', 'Pas à pas.'],
  heroAccent: ['Stronger adventures.', 'もっと強い冒険者へ。', '迎接更强的挑战。', '더 강한 모험으로.', '迎接更強的挑戰。', 'Aventuras más fuertes.', 'สู่การผจญภัยที่แข็งแกร่งขึ้น', 'Aventuras mais fortes.', 'Stärker ins Abenteuer.', 'Des aventures plus solides.'],
  firstExpedition: ['YOUR FIRST EXPEDITION', 'はじめての冒険', '第一次冒险', '첫 번째 모험', '第一次冒險', 'TU PRIMERA EXPEDICIÓN', 'การสำรวจครั้งแรก', 'SUA PRIMEIRA EXPEDIÇÃO', 'DEINE ERSTE EXPEDITION', 'VOTRE PREMIÈRE EXPÉDITION'],
  equipStep: ['Equip your adventurer', '装備を整えよう', '装备冒险者', '모험가에게 장비 착용', '裝備冒險者', 'Equipa a tu aventurero', 'สวมอุปกรณ์ให้นักผจญภัย', 'Equipe seu aventureiro', 'Rüste deinen Abenteurer aus', 'Équipez votre aventurier'],
  equipDetail: ['A weapon, armor and a ring.', '武器・防具・指輪を選ぼう。', '选择武器、防具和戒指。', '무기, 방어구, 반지를 선택하세요.', '選擇武器、防具和戒指。', 'Un arma, armadura y un anillo.', 'อาวุธ เกราะ และแหวน', 'Uma arma, armadura e um anel.', 'Waffe, Rüstung und Ring.', 'Une arme, une armure et un anneau.'],
  dungeonStep: ['Choose a dungeon', 'ダンジョンを選ぼう', '选择地下城', '던전 선택', '選擇地下城', 'Elige una mazmorra', 'เลือกดันเจี้ยน', 'Escolha uma masmorra', 'Wähle einen Dungeon', 'Choisissez un donjon'],
  dungeonDetail: ['Start small. Let the adventure run.', '無理のない場所から出発しよう。', '从简单的地方开始冒险。', '쉬운 곳부터 모험을 시작하세요.', '從簡單的地方開始冒險。', 'Empieza poco a poco y deja avanzar la aventura.', 'เริ่มจากง่าย ๆ แล้วปล่อยให้ผจญภัย', 'Comece aos poucos e deixe a aventura seguir.', 'Fang klein an und lass das Abenteuer laufen.', 'Commencez doucement et laissez l’aventure avancer.'],
  returnStep: ['Return and improve', '帰還して強くなろう', '归来并提升', '귀환 후 강화', '歸來並提升', 'Regresa y mejora', 'กลับมาแล้วพัฒนา', 'Volte e melhore', 'Zurückkehren und verbessern', 'Revenez et progressez'],
  returnDetail: ['Read the results. Keep better gear.', '結果を確認し、装備を見直そう。', '查看结果，保留更好的装备。', '결과를 읽고 더 좋은 장비를 챙기세요.', '查看結果，保留更好的裝備。', 'Lee los resultados y conserva el mejor equipo.', 'อ่านผลลัพธ์และเก็บอุปกรณ์ที่ดีกว่า', 'Leia os resultados e guarde o melhor equipamento.', 'Lies die Ergebnisse und behalte bessere Ausrüstung.', 'Lisez les résultats et gardez le meilleur équipement.'],
  home: ['Home', 'ホーム', '首页', '홈', '首頁', 'Inicio', 'หน้าหลัก', 'Início', 'Start', 'Accueil'],
  start: ['Start here', 'はじめての方へ', '新手入门', '시작 안내', '新手入門', 'Empieza aquí', 'เริ่มที่นี่', 'Comece aqui', 'Hier anfangen', 'Bien débuter'],
  reference: ['Game reference', 'ゲーム図鑑', '游戏资料', '게임 도감', '遊戲資料', 'Enciclopedia', 'ข้อมูลเกม', 'Enciclopédia', 'Spiellexikon', 'Encyclopédie'],
  guides: ['Guides', '攻略ガイド', '攻略指南', '공략', '攻略指南', 'Guías', 'คู่มือ', 'Guias', 'Anleitungen', 'Guides'],
  tools: ['Tools', 'ツール', '工具', '도구', '工具', 'Herramientas', 'เครื่องมือ', 'Ferramentas', 'Werkzeuge', 'Outils'],
  search: ['Search', '検索', '搜索', '검색', '搜尋', 'Buscar', 'ค้นหา', 'Pesquisar', 'Suchen', 'Rechercher'],
  searchHint: ['Search an item, enemy or ability…', '装備・魔物・能力を検索…', '搜索装备、怪物或能力…', '장비, 몬스터, 능력 검색…', '搜尋裝備、怪物或能力…', 'Busca equipo, enemigos o habilidades…', 'ค้นหาอุปกรณ์ ศัตรู หรือความสามารถ…', 'Busque equipamentos, inimigos ou habilidades…', 'Ausrüstung, Gegner oder Fähigkeit suchen…', 'Chercher un équipement, ennemi ou talent…'],
  weapons: ['Weapons', '武器', '武器', '무기', '武器', 'Armas', 'อาวุธ', 'Armas', 'Waffen', 'Armes'],
  armor: ['Armor & shields', '防具・盾', '防具与盾牌', '방어구와 방패', '防具與盾牌', 'Armaduras y escudos', 'เกราะและโล่', 'Armaduras e escudos', 'Rüstung & Schilde', 'Armures et boucliers'],
  rings: ['Rings', '指輪', '戒指', '반지', '戒指', 'Anillos', 'แหวน', 'Anéis', 'Ringe', 'Anneaux'],
  monsters: ['Monsters', '魔物', '怪物', '몬스터', '怪物', 'Monstruos', 'มอนสเตอร์', 'Monstros', 'Monster', 'Monstres'],
  bosses: ['Bosses', 'ボス', '首领', '보스', '首領', 'Jefes', 'บอส', 'Chefes', 'Bosse', 'Boss'],
  dungeons: ['Dungeons', 'ダンジョン', '地下城', '던전', '地下城', 'Mazmorras', 'ดันเจี้ยน', 'Masmorras', 'Dungeons', 'Donjons'],
  enchantments: ['Enchantments & abilities', '付与能力', '附魔与能力', '부여 능력', '附魔與能力', 'Encantamientos y habilidades', 'เสริมพลังและความสามารถ', 'Encantamentos e habilidades', 'Verzauberungen & Fähigkeiten', 'Enchantements et talents'],
  materials: ['Materials', '素材', '材料', '소재', '材料', 'Materiales', 'วัสดุ', 'Materiais', 'Materialien', 'Matériaux'],
  all: ['All', 'すべて', '全部', '전체', '全部', 'Todo', 'ทั้งหมด', 'Todos', 'Alle', 'Tout'],
  results: ['results', '件', '条结果', '개 결과', '筆結果', 'resultados', 'ผลลัพธ์', 'resultados', 'Ergebnisse', 'résultats'],
  noResults: ['No matches. Try an English or Japanese name, or a shorter search.', '該当なし。英語名・日本語名や短い語で検索してください。', '没有匹配项，请尝试英文名、日文名或更短的词。', '결과가 없습니다. 영어, 일본어 이름이나 짧은 검색어를 사용하세요.', '沒有符合項目，請嘗試英文名、日文名或較短的詞。', 'Sin resultados. Prueba un nombre en inglés o japonés, o una búsqueda más corta.', 'ไม่พบ ลองชื่อภาษาอังกฤษ ญี่ปุ่น หรือคำที่สั้นลง', 'Sem resultados. Tente um nome em inglês ou japonês, ou uma busca menor.', 'Keine Treffer. Englischen/japanischen Namen oder kürzeren Begriff versuchen.', 'Aucun résultat. Essayez un nom anglais ou japonais, ou un terme plus court.'],
  name: ['Name', '名前', '名称', '이름', '名稱', 'Nombre', 'ชื่อ', 'Nome', 'Name', 'Nom'],
  level: ['Level', 'レベル', '等级', '레벨', '等級', 'Nivel', 'เลเวล', 'Nível', 'Stufe', 'Niveau'],
  value: ['Value', '数値', '数值', '수치', '數值', 'Valor', 'ค่า', 'Valor', 'Wert', 'Valeur'],
  effect: ['Effect', '効果', '效果', '효과', '效果', 'Efecto', 'ผล', 'Efeito', 'Effekt', 'Effet'],
  type: ['Type', '種類', '类型', '종류', '類型', 'Tipo', 'ประเภท', 'Tipo', 'Typ', 'Type'],
  power: ['Base power', '基礎性能', '基础性能', '기본 성능', '基礎性能', 'Potencia base', 'พลังพื้นฐาน', 'Poder base', 'Grundstärke', 'Puissance de base'],
  growth: ['Per level', 'レベル毎', '每级成长', '레벨당', '每級成長', 'Por nivel', 'ต่อเลเวล', 'Por nível', 'Pro Stufe', 'Par niveau'],
  upgrade: ['Base upgrade limit', '基礎強化上限', '基础强化上限', '기본 강화 한도', '基礎強化上限', 'Límite de mejora base', 'ขีดจำกัดอัปเกรดพื้นฐาน', 'Limite de melhoria base', 'Grundlimit der Verbesserung', 'Limite de renforcement de base'],
  evolution: ['Evolves into', '進化先', '进化为', '진화 대상', '進化為', 'Evoluciona a', 'วิวัฒนาการเป็น', 'Evolui para', 'Entwickelt sich zu', 'Évolue en'],
  set: ['Set partner', 'セット装備', '套装搭配', '세트 장비', '套裝搭配', 'Compañero de conjunto', 'อุปกรณ์ชุด', 'Parceiro de conjunto', 'Set-Partner', 'Partenaire de panoplie'],
  drops: ['Listed drops', 'ドロップ候補', '掉落物', '드롭 목록', '掉落物', 'Objetos obtenibles', 'ของดรอป', 'Itens obtidos', 'Geliste Beute', 'Butin indiqué'],
  found: ['Found in', '出現場所', '出现地点', '출현 장소', '出現地點', 'Se encuentra en', 'พบที่', 'Encontrado em', 'Fundorte', 'Où le trouver'],
  sources: ['Sources & links', '関連項目', '来源与链接', '출처와 링크', '來源與連結', 'Fuentes y enlaces', 'แหล่งที่มาและลิงก์', 'Fontes e links', 'Quellen & Links', 'Sources et liens'],
  floors: ['Listed floors', '階層一覧', '楼层列表', '층 목록', '樓層列表', 'Pisos indicados', 'ชั้นที่ระบุ', 'Andares listados', 'Geliste Ebenen', 'Étages indiqués'],
  minutes: ['Minutes per floor', '1階あたりの分数', '每层分钟数', '층당 분', '每層分鐘數', 'Minutos por piso', 'นาทีต่อชั้น', 'Minutos por andar', 'Minuten pro Ebene', 'Minutes par étage'],
  unlock: ['Listed prerequisite', '前提ダンジョン', '前置地下城', '선행 던전', '前置地下城', 'Requisito indicado', 'เงื่อนไขที่ระบุ', 'Pré-requisito indicado', 'Geliste Voraussetzung', 'Prérequis indiqué'],
  back: ['Back to reference', '図鑑に戻る', '返回资料', '도감으로', '返回資料', 'Volver a la enciclopedia', 'กลับไปข้อมูลเกม', 'Voltar à enciclopédia', 'Zurück zum Lexikon', 'Retour à l’encyclopédie'],
  menu: ['Menu', 'メニュー', '菜单', '메뉴', '選單', 'Menú', 'เมนู', 'Menu', 'Menü', 'Menu'],
  skip: ['Skip to content', '本文へ移動', '跳至正文', '본문으로 건너뛰기', '跳至正文', 'Ir al contenido', 'ข้ามไปเนื้อหา', 'Ir ao conteúdo', 'Zum Inhalt', 'Aller au contenu'],
  language: ['Language', '言語', '语言', '언어', '語言', 'Idioma', 'ภาษา', 'Idioma', 'Sprache', 'Langue'],
  coverage: ['Version & coverage', 'バージョン・収録範囲', '版本与覆盖范围', '버전과 수록 범위', '版本與收錄範圍', 'Versión y cobertura', 'เวอร์ชันและขอบเขต', 'Versão e cobertura', 'Version & Abdeckung', 'Version et couverture'],
  englishGuide: ['Guide text is in English.', 'ガイド本文は現在英語です。', '指南正文目前为英文。', '공략 본문은 현재 영어입니다.', '指南正文目前為英文。', 'El texto de la guía está en inglés.', 'เนื้อหาคู่มือขณะนี้เป็นภาษาอังกฤษ', 'O texto do guia está em inglês.', 'Der Leitfaden ist derzeit auf Englisch.', 'Le texte du guide est actuellement en anglais.'],
  intro: ['Learn the game. Plan your next dungeon.', 'ゲームを知り、次の冒険に備えよう。', '了解游戏，规划下一次冒险。', '게임을 배우고 다음 던전을 준비하세요.', '了解遊戲，規劃下一次冒險。', 'Aprende a jugar. Prepara tu próxima mazmorra.', 'เรียนรู้เกม เตรียมตัวสู่ดันเจี้ยนถัดไป', 'Aprenda o jogo. Prepare a próxima masmorra.', 'Lerne das Spiel. Plane deinen nächsten Dungeon.', 'Comprenez le jeu. Préparez votre prochain donjon.'],
  gameData: ['Game data', 'ゲームデータ', '游戏数据', '게임 데이터', '遊戲資料', 'Datos del juego', 'ข้อมูลเกม', 'Dados do jogo', 'Spieldaten', 'Données du jeu'],
  journal: ['Community notes', 'コミュニティの記録', '社区记录', '커뮤니티 기록', '社群記錄', 'Notas de la comunidad', 'บันทึกชุมชน', 'Notas da comunidade', 'Community-Notizen', 'Notes communautaires'],
  next: ['Continue reading', '続きを読む', '继续阅读', '계속 읽기', '繼續閱讀', 'Seguir leyendo', 'อ่านต่อ', 'Continuar lendo', 'Weiterlesen', 'Poursuivre la lecture'],
} as const;
export type Label = keyof typeof text;
export function ui(locale: Locale, key: Label) { return text[key][index[locale]]; }
