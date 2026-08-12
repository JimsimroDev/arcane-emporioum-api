INSERT INTO artifacts (id, title, description, price, required_level, in_stock, category, rarity, image_url)
VALUES (5, 'Frostfang Dagger',
        'A dagger infused with eternal ice that slows enemies on impact.',
        1800.00, 10, TRUE, 'WEAPON', 'RARE',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1786321036/Daga_Colmillo_de_Escarcha_tbc2o8.png'),

       (6, 'Scroll of Celestial Insight',
        'A mystical scroll that reveals hidden paths and secrets for a short period.',
        750.00, 8, TRUE, 'SCROLL', 'COMMON',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1786321130/Pergamino_de_Perspicacia_Celestial_byoum6.png'),

       (7, 'Dragonheart Armor',
        'Armor forged from ancient dragon scales, greatly increasing defense.',
        8500.00, 35, TRUE, 'ARMOR', 'EPIC',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1786321235/Armadura_Coraz%C3%B3n_de_Drag%C3%B3n_nb4eey.png'),

       (8, 'Orb of Eternal Echoes',
        'A relic that stores fragments of forgotten memories and ancient knowledge.',
        12000.00, 40, TRUE, 'RELIC', 'LEGENDARY',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1786321299/Orbe_de_Ecos_Eternos_ayubtd.png'),

       (9, 'Potion of Shadowstep',
        'A dark elixir that increases movement speed and grants brief stealth.',
        950.00, 15, TRUE, 'POTION', 'RARE',
        'https://res.cloudinary.com/sui5sz6t/image/upload/Poci%C3%B3n_de_Paso_Sombr%C3%ADo_lo79sw.png'),

       (10, 'Thunderstrike Hammer',
        'A mighty hammer capable of unleashing lightning with each powerful strike.',
        15000.00, 45, TRUE, 'WEAPON', 'LEGENDARY',
        'https://res.cloudinary.com/sui5sz6t/image/upload/Martillo_Golpe_del_Trueno_ryafdf.png');

INSERT INTO artifact_translations (id_artifact, locale, title, description)
VALUES

-- Artifact 5
(5, 'es', 'Daga Colmillo de Escarcha',
 'Una daga imbuida con hielo eterno que ralentiza a los enemigos al impactar.'),
(5, 'en', 'Frostfang Dagger',
 'A dagger infused with eternal ice that slows enemies on impact.'),
(5, 'pt', 'Adaga Presa de Gelo',
 'Uma adaga infundida com gelo eterno que desacelera os inimigos ao atingir.'),

-- Artifact 6
(6, 'es', 'Pergamino de Perspicacia Celestial',
 'Un pergamino místico que revela caminos ocultos y secretos durante un breve período.'),
(6, 'en', 'Scroll of Celestial Insight',
 'A mystical scroll that reveals hidden paths and secrets for a short period.'),
(6, 'pt', 'Pergaminho da Percepção Celestial',
 'Um pergaminho místico que revela caminhos ocultos e segredos por um curto período.'),

-- Artifact 7
(7, 'es', 'Armadura Corazón de Dragón',
 'Una armadura forjada con antiguas escamas de dragón que aumenta enormemente la defensa.'),
(7, 'en', 'Dragonheart Armor',
 'Armor forged from ancient dragon scales, greatly increasing defense.'),
(7, 'pt', 'Armadura Coração de Dragão',
 'Uma armadura forjada com antigas escamas de dragão que aumenta significativamente a defesa.'),

-- Artifact 8
(8, 'es', 'Orbe de Ecos Eternos',
 'Una reliquia que almacena fragmentos de recuerdos olvidados y conocimientos ancestrales.'),
(8, 'en', 'Orb of Eternal Echoes',
 'A relic that stores fragments of forgotten memories and ancient knowledge.'),
(8, 'pt', 'Orbe dos Ecos Eternos',
 'Uma relíquia que armazena fragmentos de memórias esquecidas e conhecimentos ancestrais.'),

-- Artifact 9
(9, 'es', 'Poción de Paso Sombrío',
 'Un oscuro elixir que aumenta la velocidad de movimiento y otorga un breve sigilo.'),
(9, 'en', 'Potion of Shadowstep',
 'A dark elixir that increases movement speed and grants brief stealth.'),
(9, 'pt', 'Poção do Passo Sombrio',
 'Um elixir sombrio que aumenta a velocidade de movimento e concede furtividade temporária.'),

-- Artifact 10
(10, 'es', 'Martillo Golpe del Trueno',
 'Un poderoso martillo capaz de desatar rayos con cada golpe devastador.'),
(10, 'en', 'Thunderstrike Hammer',
 'A mighty hammer capable of unleashing lightning with each powerful strike.'),
(10, 'pt', 'Martelo Golpe Trovejante',
 'Um poderoso martelo capaz de liberar relâmpagos a cada golpe devastador.');


-- Sincroniza las secuencias para que el próximo INSERT no colisione con ids manuales
SELECT setval('artifacts_id_seq', 10, true);
SELECT setval('artifact_translations_id_seq', 30, true);