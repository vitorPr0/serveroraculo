const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurando o multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Renomeia o arquivo para evitar duplicação
    }
});

const upload = multer({ storage: storage });

// Middleware para processar dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Adicionado para aceitar JSON
app.use(express.static(path.join(__dirname, 'public')));

// Array para armazenar as postagens
let posts = [];

// Rota GET para exibir o formulário de cadastro
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// Rota POST para lidar com o envio do formulário de cadastro
app.post('/submit', (req, res) => {
    const { username, email, password } = req.body;
    console.log(`Nome de Usuário: ${username}, Email: ${email}, Senha: ${password}`);
    res.redirect('/chat');
});

// Rota GET para o chat
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Nova rota POST para upload de arquivos
app.post('/submitPost', upload.single('file'), (req, res) => {
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Adiciona a nova postagem ao array
    posts.push({
        title,
        description,
        filename: file.filename, // Salva o nome do arquivo
    });

    console.log(`Título: ${title}, Descrição: ${description}, Arquivo: ${file.originalname}`);
    res.redirect('/posts'); // Redireciona para a página com os posts
});

// Rota GET para visualizar as postagens
app.get('/posts', (req, res) => {
    res.json(posts); // Retorna as postagens em formato JSON
});

// Evento de conexão do socket
io.on('connection', (socket) => {
    console.log('Um usuário se conectou');

    // Recebe e emite mensagens do chat
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Emite a mensagem para todos os usuários conectados
    });

    // Desconexão do usuário
    socket.on('disconnect', () => {
        console.log('Um usuário se desconectou');
    });
});

// Configurar a porta
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor ouvindo na porta ${PORT}`);
});
