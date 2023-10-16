
// Creamos el objeto de configuración
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    // Creamos las fisicas
    physics:{
        default: 'arcade',
        arcade:{
            gravity: {y: 300},
            debug: false
        }
    },
    // Creamos los archivos que serán precargados
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Creamos variables para puntuacion
var score = 0;
var scoreText;
var gameOver = false;

var game = new Phaser.Game(config);

function preload(){
    // Cargamos los archivos o imagenes
    // Nombre del archivo y ruta
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    // Dividimos la imagen para el tamaño del frame de alto y ancho [-|-|-|-]
    this.load.spritesheet('dude', 'assets/dude.png', {frameWidth:32, frameHeight:48});
}

function create() {
    // this.add.image(x, y, nombre)
    this.add.image(400, 300, 'sky');

    // Creamos las plataformas del juego o las fisicas estaticas
    // Crea un grupo de fisicas estaticas, existen dos tipos, estaticos y dinamicos
    platforms = this.physics.add.staticGroup();
    // Ubicación en x,y,nombre
    platforms.create(400, 568, 'ground').setScale(2).refreshBody(); // setScale - Multiplica los valores de escala
    platforms.create(600, 400,'ground');
    platforms.create(50, 250,'ground');
    platforms.create(750, 220,'ground');

    // Creamos las fisicas del personaje
    player = this.physics.add.sprite(100, 450, 'dude');
    // Le indicamos limites al personaje
    player.setCollideWorldBounds(true);
    // Le asignamos un valor de rebote al personaje
    player.setBounce(0.2);

    // Creamos las animaciones del personaje principal
    // Para ello usamos el metodo anims para la animación a la izquierda
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
        frameRate: 10, // 10 fotogramas por segundo
        repeat: -1
    });

    // Se repetirá el proceso del personaje pero ahora para animarlo cuando se quede quieto
    this.anims.create({
        key: 'turn',
        frames: [ {key: 'dude', frame: 4}],
        frameRate: 20, // 10 fotogramas por segundo
    });

    // Se repetira el proceso pero ahora para cuando el personaje gire a la derecha
    this.anims.create({
        key: 'right',                        // Nombre, inicio del fotograma, final del fotograma
        frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
        frameRate: 10, // 10 fotogramas por segundo
        repeat: -1
    });

    // Cuando se añaden fisicas se usan los metodos body
    // Cuando mayor la gravedad, mayor la caída de un personaje en Y
    // player.body.setGravityY(300); // Asignamos la gravedad

    // Agragamos colisiones entre los cuerpos y el personaje
    // Lo que se haces es superponer una colision con otra
    this.physics.add.collider(player, platforms) // Player y Collider se superponen entre si

    // Controlando el personaje (Lo normal es un gestor de eventos)
    cursor= this.input.keyboard.createCursorKeys();

    // Creamos las estrellas, el proposito del gane
    stars = this.physics.add.group({
        key: 'star', // Nombre del objeto
        repeat: 11, // Repetimos 11 veces, obtenemos 12 estrellas
        setXY: {x: 12, y: 0, stepX: 70}, // Repartimos las estrellas con step
    });

    // Asignamos un valor de rebote a las estrellas
    stars.children.iterate(function(child){
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Hacemos colisionar las estrelllas con las plataformas
    this.physics.add.collider(stars, platforms);

    // Llamamos nuestra funcion
    this.physics.add.overlap(player, stars, collectStars, null, true)

    // Puntuación
    scoreText = this.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});

    // Agregamos los enemigos o las bombas
    bombs = this.physics.add.group();
    
    this.physics.add.collider(bombs,platforms);

    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
    // Creamos condiciones
    if(gameOver){
        return
    }
        // Caminar a la izquierda
        if(cursor.left.isDown){
            player.setVelocityX(-160); // Para dar una velocidad a la izqiuerda se utiliza un valor negativo 
            player.anims.play('left', true); // Utilizamos los parametros anteriores de animación para la izquierda
        }else 
            // Caminar a la derecha
            if(cursor.right.isDown){
                player.setVelocityX(160); // Para velocidad derecha es un numero positivo
                player.anims.play('right', true);
        }else{
            // Quedarse parado
            player.setVelocityX(0); // Anulamos la velocidad horizontal sin dañar la vertical
            player.anims.play('turn', true);
        }

        // Saltar
        if(cursor.up.isDown && player.body.touching.down){
            player.setVelocityY(-330);
        }


}

// funcion para recolectar las estrellas
function collectStars(player, star){
    star.disableBody(true, true);
    // Actualizamos el puntaje
    score += 10;
    // Lo añadimos a la pantalla
    scoreText.setText('Score: '+ score);
    // Condicional para conocer cuál es la última estrella
    if(stars.countActive(true) === 0){
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0,400);
        var bomb = bombs.create(x, 16, 'bomb'); // Creamos bombas
        bomb.setBounce(1); // Rebote
        bomb.setCollideWorldBounds(true); // Activamos colisiones
        bomb.setVelocity(Phaser.Math.Between(-200, 200,20)); // Damos unvalor aleatorio a la velocidad
    }

 }

function hitBomb(player, bomb){
    // Cuando la bomba toque al jugador, el juego se pausa
    this.physics.pause();
    // Cuando la bomba toque al jugador, el jugador se pone en rojo
    player.setTint(0xff0000);
    // Añadimos la animación de ver hacia delante
    player.anims.play('turn');
    // Fin del juego
    gameOver = true;
}