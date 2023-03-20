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

<br><br>

### Dúvidas e otimização do Desafio

Na segunda entrega do desafio, conversei com o moderador Lucian Tavares que meu ajudou a sanar algumas dúvidas e deu também algumas dicas de melhorias que poderiam ser implementadas no projeto.

O primeiro ponto que conversamos foi sobre a questão da alteração feita no entrypoint do docker-compose que fez a aplicação funcionar como deveria. Ele me explicou que o container não quebrou pois na própria imagem Nodejs, o entrypoint já é chamado, não sendo necessário declarar explicitamente no Dockerfile ou no docker-compose. Um outro ponto interessante que foi abordado é que quando há um entrypoint declarado no docker-compose, é desprezado a declaração do mesmo no Dockerfile.

Outra melhoria que foi sugerida implementar foi remover a declaração do "npm install" do Dockerfile e passar depois do dockerize no próprio entrypoint, dessa forma ele segura a instalação dos pacotes até a confirmação da comunicação com o banco de dados e também evita que o container tente acessar uma lib que ainda não foi previamente instalada. Outra opção seria criar um volume anônimo\* da node_modules, o que teria o mesmo impacto.

\*Volume anônimo cria a pasta node_modules mas ela não exibe nada localmente dentro dela. Seria como se fosse um "link" do conteúdo no container

Foi solicitado também:

- Remover a exposição da porta 3000 no container NodeJs, pois o Nginx já está fazendo o papel intermediador e vamos acessar pela porta dele;
- Remover a declaração de network do docker-compose, pois nas versões mais recentes ele já cria de forma automática. Sendo necessário somente quando temos declarações em docker-composes diferentes;
- Apontar o USER nos Dockerfiles para que os arquivos tem o mesmo nível de permissão do usuário, caso contrário a permissão padrão será a de root, obrigado a declaração do "sudo" e não permitindo manipular os arquivos do container de forma livre
- Mapear os volumes do NodeJs para permitir manipular os arquivos localmente
- Criar um bash.sh para abstrair os comandos que serão passados no entrypoint num arquivo isolado
  <br><br>

### Configuração do usuário [NodeJs]

Estava tentando fazer as configurações referente a passar o comando "npm install" do Dockerfile para o entrypoint, criar o volume compartilhado com a minha pasta local e criar o volume anônimo da node_modules. Porém estava levando um erro de permission denied.

Isso se deve ao fato que nas primeiras tentativas eu criei tudo baseado no usuário root e agora não conseguia acessar pois o meu usuário estava abaixo deste. Então o que eu precisava fazer era determinar que o usuário do container estaria no mesmo nível de permissão do meu usuário

Para isso, inclui no Dockerfile o "USER node", tentei criar o diretório e instalar as dependência nodejs a partir dele, porém sem sucesso. Era retornado um erro de permissão logo na criação da pasta "usr/src/app". Fiz isso seguindo o material complementar passado pelo próprio Tavares.

[YouTube - Canal FullCycle | Docker avançado no VSCode](https://www.youtube.com/watch?v=oAcrXHRAqoY&t=2646s)

E procurando em alguns forums achei uma solução que ainda preciso validar se é a correta onde:

1. Eu crio a pasta pelo usuário root;
2. Passo a permissão dela para o grupo node;
3. Declaro o "USER node"
4. Declaro o "WORKDIR"
5. Copio o package.json para o container;
6. Rodo "npm install" pelo Dockerfile e não pelo entrypoint

Fonte: [Cannot create directory. Permission denied inside docker container](https://stackoverflow.com/questions/45553074/cannot-create-directory-permission-denied-inside-docker-container)

Dessa forma a aplicação rodou corretamente, porém a instalação das dependências do nodejs rodaram em paralelo com a subida do container mysql
<br><br>

### Configuração do usuário [MySQL]

Estava com uma certa dificuldade de criar os volumes para o banco mysql com um usuário diferente do "root". Entrei no container mysql e não achei um usuário de mesmo nível de permissão e grupo que o meu (1000:1000). Tentei primeiro criar um usuário via dockerfile e atribuir com "chown" a permissão para a pasta /var/lib/mysql e mudar o usuário do container para este novo, porém sem sucesso, pois quando começava a subir o container ele morria com erro de permissão.

Depois de algumas tentativas, cheguei em algo que não fez o container morrer, mas ainda não tinha permissão total de manipular os arquivos localmente:

Dockerfile

```
FROM mysql:5.7

ARG UID=1000
ARG GID=1000

RUN groupadd -g "${GID}" db \
    && useradd --create-home --no-log-init -u "${UID}" -g "${GID}" db

COPY ./sql/ /docker-entrypoint-initdb.d/

CMD [ "chown", "-R", "1000:1000", "/var/lib/mysql" ]

```

Docker-compose

```
mysql-database:
build:
    context: mysql
command: --innodb-use-native-aio=0
container_name: database
restart: always
tty: true
environment:
    - MYSQL_DATABASE=nodedb
    - MYSQL_ROOT_PASSWORD=root
volumes:
    - ./mysql/dbdata:/var/lib/mysql
```

Como resultado, ele alterou o user da pasta dbdata para "systemd-coredump" e o meu grupo "luismascarenhas". Identifiquei que este usuário "systemd-coredump" seria equivalente ao usuário "mysql" do container. Porém desta forma não tenho permissão para manipular os arquivos da pasta a menos que eu de um chown para o meu username.

O moderador Lucian me ajudou novamente e sugeriu que eu simplesmente alterasse o id do usuário mysql de "999" para "1000" que seria o mesmo do meu usuário local. Dessa forma, quando os volumes fossem compartilhados, eu conseguiria manipular livremente e foi o que deu certo:

MySQL DockerFile

```
FROM mysql:5.7

RUN usermod -u 1000 mysql

COPY ./sql/ /docker-entrypoint-initdb.d/
```
