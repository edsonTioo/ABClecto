<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Level;
use App\Models\Minigame;
use App\Models\Student;
use Illuminate\Database\Seeder;

/**
 * Catálogo base: 6 minijuegos × 10 niveles = 60 actividades con contenido progresivo.
 * El profesor puede editar palabras/letras/preguntas y agregar niveles extra desde
 * /profesor/niveles.
 *
 * ATENCIÓN: limpia niveles/actividades (datos demo) antes de recrearlos.
 */
class GamesDemoSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------
        // Catálogo de minijuegos (una fila por pestaña)
        // ---------------------------------------------------------------
        $catalog = [
            ['sopa-letras', 'Sopa de Letras', 'Encuentra las palabras escondidas en la sopa', '🔍', 1],
            ['sombras-letras', 'Sombras de Letras', 'Adivina la letra a partir de su sombra', '🌑', 2],
            ['construccion', 'Construcción', 'Arrastra letras y palabras para formar frases', '🧩', 3],
            ['completar', 'Completar Desafíos', 'Rellena los espacios que faltan', '✏️', 4],
            ['match-visual', 'Match Visual', 'Une cada imagen con su palabra', '🖼️', 5],
            ['comprension', 'Comprensión Lectora', 'Lee, escucha y responde la trivia', '📖', 6],
        ];

        foreach ($catalog as [$slug, $name, $description, $icon, $sort]) {
            Minigame::updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'description' => $description,
                'icon' => $icon,
                'sort_order' => $sort,
                'is_active' => true,
            ]);
        }

        // ---------------------------------------------------------------
        // Reinicio de contenido demo (niveles + actividades)
        // ---------------------------------------------------------------
        Activity::query()->delete();
        Level::query()->delete();

        // ---------------------------------------------------------------
        // Niveles 1..10 por módulo (recompensas progresivas)
        // ---------------------------------------------------------------
        foreach (['abecedario', 'silabas', 'palabras', 'oraciones', 'comprension'] as $module) {
            for ($n = 1; $n <= 10; $n++) {
                Level::create([
                    'module' => $module,
                    'number' => $n,
                    'title' => ucfirst($module) . " - Nivel {$n}",
                    'xp_reward' => 30 + $n * 10,       // 40 .. 130 XP
                    'coins_reward' => 5 + $n * 2,        // 7 .. 25 monedas
                    'is_active' => true,
                ]);
            }
        }

        foreach ($this->plan() as [$slug, $module, $number, $difficulty, $config]) {
            $minigame = Minigame::where('slug', $slug)->firstOrFail();
            $level = Level::where('module', $module)->where('number', $number)->firstOrFail();

            $level->activities()->create([
                'minigame_id' => $minigame->id,
                'order' => 0,
                'difficulty' => $difficulty,
                'config' => $config,
                'is_active' => true,
            ]);
        }

        // ---------------------------------------------------------------
        // Estudiante demo (HUD del jugador)
        // ---------------------------------------------------------------
        Student::updateOrCreate(
            ['login_code' => 'DEMO01'],
            [
                'name' => 'Sofi',
                'age' => 7,
                'grade' => '2º Primaria',
                'xp' => 340,
                'coins' => 120,
                'level' => 4,
                'current_streak' => 5,
                'longest_streak' => 9,
                'is_active' => true,
            ],
        );
    }

    /**
     * [minigame_slug, módulo, número de nivel, dificultad, config]
     *
     * Mapeo de módulos:
     *   sombras     → abecedario  (1-10)
     *   sopa        → silabas     (1-10)
     *   match       → palabras    (1-10)
     *   construccion→ oraciones   (1-10)  ← comparte módulo con completar
     *   completar   → oraciones   (1-10)
     *   comprension → comprension (1-10)
     *
     * @return array<int, array{0: string, 1: string, 2: int, 3: int, 4: array}>
     */
    private function plan(): array
    {
        $plan = [];

        // ============ 🌑 SOMBRAS DE LETRAS (abecedario 1-10) ============
        $letrasSombras = [
            ['A', 'E', 'I', 'O', 'U'],
            ['M', 'S', 'P', 'L'],
            ['R', 'N', 'T', 'C', 'D'],
            ['B', 'G', 'V', 'F', 'J'],
            ['H', 'Q', 'K', 'W', 'Y'],
            ['L', 'R', 'S', 'B', 'D'],
            ['P', 'Q', 'G', 'O', 'C'],
            ['M', 'N', 'U', 'A', 'H'],
            ['E', 'F', 'T', 'Z', 'I'],
            ['X', 'K', 'W', 'Y', 'J'],
        ];
        foreach ($letrasSombras as $i => $letters) {
            $plan[] = ['sombras-letras', 'abecedario', $i + 1, min(5, $i + 1), ['letters' => $letters]];
        }

        // ============ 🔍 SOPA DE LETRAS (silabas 1-10) ============
        $sopa = [
            [['SOL', 'PAN', 'MAR'], 6],
            [['GATO', 'FLOR', 'CASA', 'LUNA'], 7],
            [['QUESO', 'PERRO', 'MESA', 'PAN'], 7],
            [['RANA', 'LIBRO', 'MAPA', 'NUBE', 'SOL'], 8],
            [['PLUMA', 'TIGRE', 'JUEGO', 'FLOR'], 8],
            [['ESCUELA', 'GATO', 'LUNA', 'MAR'], 9],
            [['MARIPOSA', 'PERRO', 'SOL'], 9],
            [['CABALLO', 'VENTANA', 'RANA', 'PAN'], 10],
            [['ELEFANTE', 'FLOR', 'QUESO', 'NUBE'], 10],
            [['TORTUGA', 'MANZANA', 'PLUMA', 'GATO'], 11],
        ];
        foreach ($sopa as $i => [$words, $grid]) {
            $plan[] = ['sopa-letras', 'silabas', $i + 1, min(5, $i + 1), ['words' => $words, 'grid' => $grid]];
        }

        // ============ 🖼️ MATCH VISUAL (palabras 1-10) ============
        $matchPool = [
            ['emoji' => '🐶', 'word' => 'PERRO'], ['emoji' => '🐱', 'word' => 'GATO'],
            ['emoji' => '☀️', 'word' => 'SOL'], ['emoji' => '🌙', 'word' => 'LUNA'],
            ['emoji' => '🐟', 'word' => 'PEZ'], ['emoji' => '🌸', 'word' => 'FLOR'],
            ['emoji' => '🍞', 'word' => 'PAN'], ['emoji' => '🏠', 'word' => 'CASA'],
            ['emoji' => '🐴', 'word' => 'CABALLO'], ['emoji' => '🌳', 'word' => 'ÁRBOL'],
            ['emoji' => '⭐', 'word' => 'ESTRELLA'], ['emoji' => '🐸', 'word' => 'RANA'],
            ['emoji' => '🍎', 'word' => 'MANZANA'], ['emoji' => '🐮', 'word' => 'VACA'],
            ['emoji' => '🐔', 'word' => 'GALLINA'], ['emoji' => '🦆', 'word' => 'PATO'],
            ['emoji' => '🐑', 'word' => 'OVEJA'], ['emoji' => '🐵', 'word' => 'MONO'],
            ['emoji' => '🐻', 'word' => 'OSO'], ['emoji' => '🦁', 'word' => 'LEÓN'],
            ['emoji' => '🐯', 'word' => 'TIGRE'], ['emoji' => '🐺', 'word' => 'LOBO'],
            ['emoji' => '🦊', 'word' => 'ZORRO'], ['emoji' => '🐼', 'word' => 'PANDA'],
            ['emoji' => '🐨', 'word' => 'KOALA'], ['emoji' => '🦒', 'word' => 'JIRAFA'],
            ['emoji' => '🐘', 'word' => 'ELEFANTE'], ['emoji' => '🦓', 'word' => 'CEBRA'],
            ['emoji' => '🐢', 'word' => 'TORTUGA'], ['emoji' => '🐬', 'word' => 'DOLFIN'],
            ['emoji' => '🦄', 'word' => 'CABALLO'], ['emoji' => '🐝', 'word' => 'ABEJA'],
        ];
        $matchSizes = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
        foreach ($matchSizes as $i => $size) {
            // Ventana deslizante para variar el contenido entre niveles.
            $start = min($i * 2, count($matchPool) - $size);
            $plan[] = ['match-visual', 'palabras', $i + 1, min(5, $i + 1), [
                'pairs' => array_slice($matchPool, $start, $size),
            ]];
        }

        // ============ 🧩 CONSTRUCCIÓN (oraciones 1-10) ============
        $construccion = [
            ['SOL'],
            ['PAN'],
            ['GATO'],
            ['FLOR'],
            ['RANA', 'LA RANA'],
            ['LIBRO', 'EL LIBRO'],
            ['MAPA', 'MI MAPA'],
            ['NUBE', 'LA NUBE VUELA'],
            ['PERRO', 'EL PERRO CORRE'],
            ['ESCUELA', 'VOY A LA ESCUELA'],
        ];
        foreach ($construccion as $i => $entry) {
            $config = ['word' => $entry[0]];
            if (isset($entry[1])) {
                $config['sentence'] = $entry[1];
            }
            $plan[] = ['construccion', 'oraciones', $i + 1, min(5, $i + 1), $config];
        }

        // ============ ✏️ COMPLETAR DESAFÍOS (oraciones 1-10) ============
        $completar = [
            // Niveles 1-3: letra que falta
            [['M_má', 'A', ['A', 'O', 'E']], ['S_l', 'O', ['U', 'O', 'A']], ['P_n', 'A', ['E', 'I', 'A']]],
            [['C_sa', 'A', ['E', 'A', 'O']], ['G_to', 'A', ['O', 'E', 'A']], ['L_na', 'U', ['I', 'U', 'A']]],
            [['M_sa', 'E', ['A', 'E', 'O']], ['P_ra', 'A', ['U', 'A', 'E']], ['Q_so', 'U', ['E', 'U', 'I']]],
            // Niveles 4-6: palabra que falta en oración corta
            [['El perro ___ rápido', 'corre', ['corre', 'vuela', 'lee']], ['La gata ___ leche', 'bebe', ['come', 'bebe', 'salta']], ['Nos ___ a jugar', 'vamos', ['miramos', 'vamos', 'quedamos']]],
            [['Veo la ___ en el cielo', 'luna', ['mesa', 'luna', 'silla']], ['El ___ come hierba', 'caballo', ['gato', 'pez', 'caballo']], ['Mi mamá me ___ mucho', 'quiere', ['quiere', 'mira', 'lee']]],
            [['Yo ___ agua', 'bebo', ['bebo', 'como', 'corro']], ['La puerta está ___', 'abierta', ['abierta', 'rota', 'verde']], ['Nosotros ___ en clase', 'aprendemos', ['jugamos', 'aprendemos', 'dormimos']]],
            // Niveles 7-10: oraciones más largas
            [['El ___ vuela muy alto', 'pájaro', ['perro', 'pájaro', 'pez']], ['La luna ___ de noche', 'brilla', ['brilla', 'ladra', 'salta']], ['Mi perro se ___ con la pelota', 'juega', ['esconde', 'juega', 'duerme']]],
            [['Mi mamá me ___ un cuento', 'lee', ['canta', 'lee', 'vende']], ['Los niños ___ al parque', 'van', ['rompen', 'van', 'tiran']], ['El tren ___ por la montaña', 'pasa', ['pasa', 'vuela', 'nada']]],
            [['En la escuela ___ muchas cosas', 'aprendemos', ['aprendemos', 'rompemos', 'miramos']], ['Mi gato ___ siesta por la tarde', 'toma', ['toma', 'hace', 'corre']], ['La gallina ___ huevos', 'pone', ['pone', 'come', 'vende']]],
            [['Los pájaros ___ por el cielo', 'vuelan', ['vuelan', 'nadan', 'corren']], ['Mi abuela ___ cuentos bonitos', 'cuenta', ['cuenta', 'rompe', 'salta']], ['Cuando el semáforo está ___, nos detenemos', 'rojo', ['verde', 'rojo', 'azul']]],
        ];
        foreach ($completar as $i => $items) {
            $plan[] = ['completar', 'oraciones', $i + 1, min(5, $i + 1), [
                'items' => array_map(
                    fn ($item) => ['prompt' => $item[0], 'answer' => $item[1], 'options' => $item[2]],
                    $items,
                ),
            ]];
        }

        // ============ 📖 COMPRENSIÓN LECTORA (comprension 1-10) ============
        $lecturas = [
            ['Mi amigo el pato', 'El pato Juan vive en el estanque. Le gusta nadar y comer maíz. Todos los días sale a pasear con su mamá.', [
                ['¿Cómo se llama el pato?', ['Juan', 'Pedro', 'Luna'], 'Juan'],
                ['¿Qué le gusta comer?', ['pan', 'maíz', 'queso'], 'maíz'],
            ]],
            ['La gata Mimi', 'Mimi es una gata gris. Duerme en la alfombra y persigue mariposas en el jardín. Por la noche se sienta a mirar la luna.', [
                ['¿De qué color es Mimi?', ['blanca', 'gris', 'negra'], 'gris'],
                ['¿Qué persigue en el jardín?', ['mariposas', 'pájaros', 'ratones'], 'mariposas'],
                ['¿Qué hace Mimi de noche?', ['corre', 'mira la luna', 'ladra'], 'mira la luna'],
            ]],
            ['El bosque mágico', 'En el bosque vive un árbol muy grande llamado Roble. Los pajarillos hacen nidos en sus ramas. Cuando sopla el viento, las hojas bailan y suenan como música.', [
                ['¿Cómo se llama el árbol?', ['Roble', 'Pino', 'Sauce'], 'Roble'],
                ['¿Dónde hacen los nidos los pajarillos?', ['en las ramas', 'en la raíz', 'en el suelo'], 'en las ramas'],
                ['¿Qué hacen las hojas con el viento?', ['se caen todas', 'bailan', 'brillan'], 'bailan'],
            ]],
            ['El cumpleaños de Ana', 'Hoy es el cumpleaños de Ana. Tiene siete años. Su mamá preparó una torta de chocolate y sus amigos le trajeron regalos. Ana soplará las velas pronto.', [
                ['¿Cuántos años cumple Ana?', ['seis', 'siete', 'ocho'], 'siete'],
                ['¿Qué preparó su mamá?', ['una torta', 'una sopa', 'una ensalada'], 'una torta'],
            ]],
            ['La granja de don Pedro', 'Don Pedro tiene una granja. Tiene tres vacas, dos gallinas y un caballo. Por la mañana les da de comer y luego se va a ordeñar.', [
                ['¿Cuántas vacas tiene don Pedro?', ['dos', 'tres', 'cuatro'], 'tres'],
                ['¿Qué hace por la mañana?', ['duerme', 'les da de comer', 'canta'], 'les da de comer'],
                ['¿Qué animal no tiene?', ['gallinas', 'caballo', 'ovejas'], 'ovejas'],
            ]],
            ['Un día de lluvia', 'Esta mañana amaneció nublado. Al mediodía empezó a llover. Leo se puso sus botas y su gabardina, y salió a saltar en los charcos.', [
                ['¿Qué tiempo hacía?', ['soleado', 'nublado y lluvioso', 'nevado'], 'nublado y lluvioso'],
                ['¿Qué se puso Leo?', ['botas y gabardina', 'traje de baño', 'gafas de sol'], 'botas y gabardina'],
            ]],
            ['El viaje en tren', 'Marta viaja en tren con su papá. El tren pasa junto al río y junto a las montañas. Marta dibuja las ventanas mientras el tren hace clic, clic, clic.', [
                ['¿Con quién viaja Marta?', ['con su mamá', 'con su papá', 'sola'], 'con su papá'],
                ['¿Qué hace Marta en el tren?', ['duerme', 'dibuja', 'llora'], 'dibuja'],
                ['¿Qué ve el tren?', ['el mar', 'el río y las montañas', 'la ciudad'], 'el río y las montañas'],
            ]],
            ['El ratón y el queso', 'Un ratón pequeño encontró un queso grande. Quiso llevárselo a su madriguera, pero el queso era muy pesado. Pidió ayuda a su hermano y juntos lo movieron.', [
                ['¿Qué encontró el ratón?', ['un queso', 'un pan', 'una manzana'], 'un queso'],
                ['¿Por qué no pudo solo?', ['porque tenía hambre', 'porque era muy pesado', 'porque estaba mojado'], 'porque era muy pesado'],
                ['¿A quién pidió ayuda?', ['a su mamá', 'a su hermano', 'al gato'], 'a su hermano'],
            ]],
            ['Los planetas', 'Alrededor del Sol giran muchos planetas. La Tierra es nuestro planeta, el tercero desde el Sol. Marte se ve rojo y Júpiter es el más grande de todos.', [
                ['¿Cuántos planetas giran alrededor del Sol?', ['muchos', 'uno', 'ninguno'], 'muchos'],
                ['¿Qué planeta es el nuestro?', ['Marte', 'la Tierra', 'Júpiter'], 'la Tierra'],
                ['¿Cuál es el más grande?', ['la Tierra', 'Marte', 'Júpiter'], 'Júpiter'],
            ]],
            ['La biblioteca del pueblo', 'En el centro del pueblo hay una biblioteca. Los niños van los sábados a escuchar cuentos. Sofía prefiere los libros de dinosaurios y siempre devuelve uno cada semana.', [
                ['¿Dónde está la biblioteca?', ['en el centro del pueblo', 'en la escuela', 'en la casa de Sofía'], 'en el centro del pueblo'],
                ['¿Cuándo van los niños?', ['los domingos', 'los sábados', 'los lunes'], 'los sábados'],
                ['¿Qué libros prefiere Sofía?', ['de dinosaurios', 'de cocinas', 'de fútbol'], 'de dinosaurios'],
                ['¿Cada cuándo devuelve un libro?', ['cada día', 'cada semana', 'cada mes'], 'cada semana'],
            ]],
        ];
        foreach ($lecturas as $i => [$title, $text, $questions]) {
            $plan[] = ['comprension', 'comprension', $i + 1, min(5, $i + 1), [
                'title' => $title,
                'text' => $text,
                'questions' => array_map(
                    fn ($q) => ['question' => $q[0], 'options' => $q[1], 'correct' => $q[2]],
                    $questions,
                ),
            ]];
        }

        return $plan;
    }
}
