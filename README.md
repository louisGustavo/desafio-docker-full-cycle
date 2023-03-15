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
<br><br>

### Configuração do Dockerize

Após o envio do desafio 2 recebi a solicitação para incluir o dockerize para que a aplicação NodeJs aguardasse a subida do container mySQL. Fiz com base no material anotado onde, o container NodeJS faria a instalação da ferramenta dockerize e pelo manifesto do docker-compose faríamos duas alterações sendo elas:

1. A inclusão da declaração de dependência que o container NodeJS teria do mysql (depends_on);
2. A manipulação do entrypoint do NodeJs para que ele rodasse o comando abaixo antes mesmo do seu próprio entrypoint

```
dockerize -wait tcp://database:3306 -timeout 40s
```

Na primeira tentativa alterei como fizemos na aula inserido exatamente a linha abaixo no manifesto

```
entrypoint: dockerize -wait tcp://database:3306 -timeout 40s docker-entrypoint.sh
```

Porém por algum motivo, ao subir as aplicações morria no seguinte erro

```
Problem with dial: dial tcp 192.168.16.2:0: connect: connection refused. Sleeping 1s
...
database    | 2023-03-15T23:44:14.037589Z 0 [Note] mysqld: ready for connections.
database    | Version: '5.7.41'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)
nodejs      | 2023/03/15 23:44:14 Connected to tcp://database:3306
nodejs      | 2023/03/15 23:44:14 Command finished successfully.
database    | 2023-03-15T23:44:14.743963Z 2 [Note] Got an error reading communication packets
nodejs exited with code 0
```

O NodeJs tentava conectar no mysql, enquanto isso o mysql ia subindo o container. Assim que ele consegue conexão com o mysql, o NodeJs deveria iniciar o entrypoint dele mas recebo antes um erro do mysql com a mensagem "Got an error reading communication packets". E o NodeJs morre.

Procurei por informações na internet sobre, mas a maioria falava pra aumentar o tamanho máximo dos packets, mas que no meu caso aparentemente não faz sentido pois não só tenho a criação de um única tabela sem dados.

Por fim procurei nos fórums da própria FullCycle com uma mensagem que eu tinha recebido logo no começo dos logs do docker-compose (Problem with dial: dial tcp...) e achei essa thread

[Problem with dial: dial tcp 192.168.16.2:0: connect: connection refused. Sleeping 1s](https://forum.code.education/forum/topico/problem-with-dial-dial-tcp-1921681620-connect-connection-refused-sleeping-1s-1650/)

Nela o Rogério Cassares estava com o mesmo problema que o meu, e com a ajuda do moderador Gabriel Carneiro Jr, ele fizeram um pequena mudança na própria linha do manifesto do entrypoint onde, após aguardar o mysql subir eles somente forçam o node executar o arquivo index.js da aplicação. Deixando-a da seguinte forma:

```
entrypoint: dockerize -wait tcp://database:3306 -timeout 40s node index.js
```

Fiz os testes aqui e deu certo também. Aplicação de pé, aguardando o container mysql rodar e iniciando posteriormente o container NodeJS com sucesso.

```
database    | 2023-03-15T23:45:05.512022Z 0 [Note] Event Scheduler: Loaded 0 events
database    | 2023-03-15T23:45:05.512356Z 0 [Note] mysqld: ready for connections.
database    | Version: '5.7.41'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)
nodejs      | 2023/03/15 23:45:06 Connected to tcp://database:3306
nodejs      | Rodando aplicação na porta 3000
```
