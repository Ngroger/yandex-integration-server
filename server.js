const express = require('express');
const mysql = require('mysql2');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const Client = require('ssh2').Client;
const { v4: uuid4 } = require('uuid');
const crypto = require('crypto');

app.use(express.json());
app.use(cors());

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}


// Создаем подключение к базе данных MySQL
const db = mysql.createConnection({
  host: '127.0.0.1', // Адрес хоста базы данных
  user: 'root', // Ваше имя пользователя базы данных
  password: 'BogdanButin06', // Ваш пароль
  database: 'yandex' // Название вашей базы данных
});

// Подключаемся к базе данных
db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('Подключено к базе данных MySQL');
});

// Разрешаем приложению использовать данные в формате JSON

app.post('/addForm', (req, res) => {
    console.log('/addForm');
    const { name, apiKey, clientID, parkID, port } = req.body;
    let responseSent = false;
    const sql = `INSERT INTO forms (name, status, apiKey, clientID, parkID, port) VALUES (?, 0, ?, ?, ?, ?)`;
    const values = [name, apiKey, clientID, parkID, port];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('SQL query error: ' + err.message);
            if (!responseSent) {
                res.status(500).send('Server error');
                responseSent = true;
            }
        } else {
            console.log('Data successfully added to the forms table.');
            if (!responseSent) {
                res.status(200).send('Data successfully added to the forms table.');
                responseSent = true;
            }

            const sshConfig = {
                host: '45.12.72.22',
                port: 22,
                username: 'root',
                password: 'm7)Y(6TEtmSc'
            };

            const sshClient = new Client();

            sshClient.on('ready', () => {
                console.log('SSH connection established successfully');

                sshClient.sftp((err, sftp) => {
                    if (err) {
                        console.error('Error creating SFTP connection: ' + err.message);
                        if (!responseSent) {
                            res.status(500).send('Server error');
                            responseSent = true;
                        }
                    } else {
                        sftp.readFile('/root/bt/template.js', 'utf-8', (err, data) => {
                            if (err) {
                                console.error('Error reading template file: ' + err.message);
                                if (!responseSent) {
                                    res.status(500).send('Server error');
                                    responseSent = true;
                                }
                            } else {
                                const headersToReplace = {
                                    'X-Client-ID': clientID,
                                    'X-Api-Key': apiKey,
                                    'X-Park-ID': parkID,
                                    '':'',
                                    // Add other headers here
                                };

                                const headersRegex = new RegExp(`'(${Object.keys(headersToReplace).join('|')}': [^,]*,)`, 'g');

                                const updatedFileContent = data.replace(headersRegex, (match) => {
                                    const headerKey = match.split(':')[0].trim().replace('\'', '');
                                    return `'${headerKey}': '${headersToReplace[headerKey]}`;
                                });

                                sftp.writeFile(`/root/bt/${name}.js`, updatedFileContent, (err) => {
                                    if (err) {
                                        console.error('Error creating the file: ' + err.message);
                                        if (!responseSent) {
                                            res.status(500).send('Server error');
                                            responseSent = true;
                                        }
                                    } else {
                                        console.log(`File ${name}.js successfully created on the server.`);
                                        if (!responseSent) {
                                            res.status(200).send('File successfully created on the server.');
                                            responseSent = true;
                                        }
                                    }
                                    sshClient.end();
                                });
                            }
                        });
                    }
                });
            });

            sshClient.on('error', (err) => {
                console.error('Error establishing SSH connection: ' + err.message);
                if (!responseSent) {
                    res.status(500).send('Server error');
                    responseSent = true;
                }
            });

            sshClient.connect(sshConfig);
        }
    });
});

app.get('/getAllForms', (req, res) => {
    const sql = 'SELECT * FROM forms';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('SQL query error: ' + err.message);
            res.status(500).send('Server error');
        } else {
            res.status(200).json(results);
        }
    });
});

app.get('/test', (req, res) => {
    console.log('/test');
})

app.listen(7000, () => {
    console.log('Сервер запущен на порту 5000');
});
