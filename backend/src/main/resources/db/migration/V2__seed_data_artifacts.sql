INSERT INTO artifacts (id, title, description, price, required_level, in_stock, category, rarity, image_url)
VALUES (1, 'Elixir of Astral Vitality',
        'A glowing blue potion that instantly restores 200 mana points and clears curse effects', 150000.00, 12, TRUE,
        'POTION', 'COMMON',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1785534477/Elixir_de_Vitalidad_Astral_ptuffb.png'),

       (2, 'Phoenix Flame Blade',
        'Forged in volcanic embers, this sword deals fire damage and has a small chance to revive its wielder.',
        2500.00, 12, TRUE, 'WEAPON', 'EPIC',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1785534722/Amuleto_de_Cronos_hgcdxi.png'),

       (3, 'Amulet of Chronos', 'An ancient relic that allows the user to briefly slow down time around them.', 9999.00,
        12, TRUE, 'RELIC', 'LEGENDARY',
        'https://res.cloudinary.com/sui5sz6t/image/upload/v1785549055/Amuleto_de_Cronos_hn53c2.png'),

       (4, 'Cloak of Invisibility',
        'Woven from moonlight threads, this enchanted cloak renders the wearer completely unseen.', 10000.00, 50, TRUE,
        'ARMOR', 'RARE', 'https://res.cloudinary.com/sui5sz6t/image/upload/v1785724820/capa_invisivilida_i0lfkh.png');

INSERT INTO artifact_translations (id_artifact, locale, title, description)
VALUES (
           -- Artifact 1
           1, 'es', 'Elixir de Vitalidad Astral',
           'Una poción azul brillante que restaura instantáneamente 200 puntos de maná y elimina efectos de maldiciones.'),
       (1, 'en', 'Elixir of Astral Vitality',
        'A glowing blue potion that instantly restores 200 mana points and clears curse effects.'),
       (1, 'pt', 'Elixir da Vitalidade Astral',

           -- Artifact 2
        'Uma poção azul brilhante que restaura instantaneamente 200 pontos de mana e remove os efeitos de maldições.'),
       (2, 'es', 'Espada de Llama de Fénix',
        'Forjada en brasas volcánicas, esta espada inflige daño de fuego y tiene una pequeña probabilidad de revivir a su portador.'),
       (2, 'en', 'Phoenix Flame Blade',
        'Forged in volcanic embers, this sword deals fire damage and has a small chance to revive its wielder.'),
       (2, 'pt', 'Espada da Chama da Fênix',
        'Forjada em brasas vulcânicas, esta espada causa dano de fogo e tem uma pequena chance de reviver seu portador.'),

       -- Artifact 3
       (3, 'es', 'Amuleto de Cronos',
        'Una reliquia antigua que permite al usuario ralentizar brevemente el tiempo a su alrededor.'),
       (3, 'en', 'Amulet of Chronos', 'An ancient relic that allows the user to briefly slow down time around them.'),
       (3, 'pt', 'Amuleto de Cronos',
        'Uma relíquia antiga que permite ao usuário desacelerar brevemente o tempo ao seu redor.'),

       -- Artifact 4
       (4, 'es', 'Manto de Invisibilidad',
        'Tejido con hilos de luz de luna, este manto encantado vuelve a su portador completamente invisible.'),
       (4, 'en', 'Cloak of Invisibility',
        'Woven from moonlight threads, this enchanted cloak renders the wearer completely unseen.'),
       (4, 'pt', 'Manto da Invisibilidade',
        'Tecido com fios de luar, este manto encantado torna seu portador completamente invisível.');


-- Sincroniza las secuencias para que el próximo INSERT no colisione con ids manuales
SELECT setval('artifacts_id_seq', 4, true);
SELECT setval('artifact_translations_id_seq', 12, true);