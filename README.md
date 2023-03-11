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

3. A imagem do deasfio precisa ter menos de 2MB

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

:construction: Em andamento :construction:
