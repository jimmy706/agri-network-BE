# Run database with docker

## Create docker container for mongodb

`docker run -d -p 27017-27019:27017-27019 --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=b1709272 mongo:4.2`

> Make sure to create user and database related to .env config

## Create docker container for neo4j

`docker run --name neo4jdb --publish=7474:7474 --publish=7687:7687 -d neo4j`

> Make sure to create user and database related to .env config

# Run

## Install
`npm install`

## Developer mode

`npm run dev`

## Production mode

```shell
npm run build
npm start
```