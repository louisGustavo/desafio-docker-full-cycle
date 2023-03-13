# Desafio Docker FullCycle

## Desafio 1

### Especificação do Desafio

Publicar uma imagem no docker hub. Quando executarmos:

```
docker run <seu-user>/fullcycle
```

Temos que ter o seguinte resultado:

```
Full Cycle Rocks!!
```

3. A imagem do desafio precisa ter menos de 2MB

### Entrega do Desafio 1

1. Fazer o pull da imagem abaixo

```
docker pull luismascarenhas/fullcycle
```

2. Via terminal rodar o comando

```
docker run luismascarenhas/fullcycle
```

Segue link do repositório também:
[DockerHub Desafio FullCycle Go](https://hub.docker.com/r/luismascarenhas/fullcycle)

---

## Desafio 2

### Especificação do Desafio

A idéia principal é que quando um usuário acesse o nginx, o mesmo fará uma chamada em nossa aplicação node.js.

Essa aplicação por sua vez adicionará um registro em nosso banco de dados mysql, cadastrando um nome na tabela people.

O retorno da aplicação node.js para o nginx deverá ser:

Full Cycle Rocks!

- Lista de nomes cadastrada no banco de dados.

Gerar o docker-compose de forma que baste rodar

```
docker-compose up -d
```

E tudo deverá estar funcionando e disponível na porta: 8080.

### Entrega do Desafio 2

Desenvolvido conforme solicitado. Acredito que seja primeiro necessário rodar o build para criar as imagens

```
docker-compose up -d --build
```

Mas depois disso, o comando somente com o -d deverá sera executado sem problemas

```
docker-compose up -d
```

<br />

---

## Anotações Pessoais sobre a resolução do Desafio

---

Achei essa doc legal que explica como montar a configuração do nginx para conectar num container NodeJS:

[NGINX with Docker and Node.js — a Beginner’s guide](https://ashwin9798.medium.com/nginx-with-docker-and-node-js-a-beginners-guide-434fe1216b6b)
<br><br>

### Insert no banco de dados

Estava apanhando com o banco de dados, e basicamente o problema era só aguardar o banco subir antes de tentar uma conexão. Eu resolvi encapsulado tanto a conexão como o INSERT e o SELECT em métodos que só eram chamados quando se batia na rota GET. Como futura melhoria vou inserir o dockerize para segurar a subida do NodeJs até que o mysql suba.
<br><br>

### Exibição do último id inserido e retorno dos dados da pessoa

Estava tentando resolver a promise para depois exibir o retorno o que, obviamente, não estava dando certo.

Ajustei esse ponto resolvendo a promise e dentro do resolve chamando o método GET. Um ponto que me encucou mas que não seria um problema é o fato de não conseguir obter o retorno das queries usando async/await no lugar de new Promise(resolve, reject). Mas no final consegui obter o resultado esperado
<br><br>

### Criação do banco de dados

Não queria subir os dados do banco com o volume compartilhado, queria que o container, além de criar a base de dados, já criasse a tabela também

Achei o passo a passo abaixo

[MySQL + Docker | Subindo um banco de dados MySQL em um container Docker](https://johnfercher.medium.com/mysql-docker-7ff6d50d6cf1)

Porém ainda não estava conseguindo porque, por algum motivo, o script sql que eu criava era ignorado

Olhei algumas threads sobre isso até encontrar essa:

[GitHub | "docker-entrypoint-initdb.d is not working" #160](https://github.com/MariaDB/mariadb-docker/issues/160)

Em alguns lugares falam que precisa apagar o conteúdo da /var/lib/mysql antes de criar. Porém não conseguia achar um comando que rodasse isso da maneira correta

Por fim, apaguei a imagem que eu já tinha gerado relacionada no "docker images" gerei novamente com o meu próprio Dockerfile e deu certo. O estranho que mesmo não compartilhando volumes, ele não perde os dados salvos no container (talvez seja porque o container não é apagado e sim só parado)
