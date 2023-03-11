const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('<h1> Full Cycle Rocks!</h1>')
})

app.listen(port, () => {
    console.log(`Rodando aplicação na porta ${port}`)
})