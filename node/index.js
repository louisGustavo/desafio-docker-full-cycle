const express = require('express')
const app = express()
const port = 3000

function createMySQLConnection () {
    const databaseConfig = {
        host: 'database',
        user: 'root',
        password: 'root',
        database: 'nodedb'
    };
    
    const mysql = require('mysql');
    const connection = mysql.createPool(databaseConfig);
    
    connection.on('error', function(err) {
        throw `Falha na conexão: ${err}`
    })

    console.log('Conexão MySQL obtida com sucesso')

    return connection
}

function insertPeople () {
    const connection = createMySQLConnection();

    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO people SET ?', {name: 'Luis Mascarenhas'}, (error, result) => {
            if (error) {
                return reject(error)
            }
            console.log(`Retorno dentro do resolve: ${result.insertId}`)
            return resolve(result.insertId)
        })
    })
}

function getPeopleById (id) {
    const connection = createMySQLConnection();

    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM people WHERE id = ${id}`, (error, result) => {
            if (error) {
                return reject(error)
            }
            console.log(`Retorno dentro do resolve do getPeopleById(): ${result}`)
            return resolve(result[0])
        })
    })
}

app.get('/', (req, res) => {

    insertPeople().then((id) => {
        getPeopleById(id).then((result) => {
            const {id, name} = result
            res.send(`<h1> Full Cycle Rocks!!</h1> <br> <ul><li>${id} | ${name}</li></ul>`)
            console.log(`id: ${id} nome: ${name}`)
        });
    });
})

app.listen(port, () => {
    console.log(`Rodando aplicação na porta ${port}`)
})