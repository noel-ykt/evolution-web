# Evolution-web

Main server: https://evo2.herokuapp.com

[FAQ (ru)](faq-ru.md)

### Install
1. clone
1. ```$ npm i```
1. ```$ cp .env.sample .env```
1. fill .env

### Run

#### dev:
```
$ npm start
```

#### prod:
```
$ NODE_ENV=production
$ npm run build
$ npm run server:start
```

#### test:
```
$ LOG_LEVEL=warn npm run test:shared
$ LOG_LEVEL=warn npm run test:shared:once
```
