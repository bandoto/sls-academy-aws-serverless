  HOW TO USE IT:
 - CREATE AN .env FILE FOLLOWING THE .env.example WITH THE REQUIRED FIELDS

 - RUN BUILD COMMAND => npm run build

 - RUN APP AS DEV => npm run dev

 - RUN DEPLOY => npm run deploy

API DOCS:

ROUTE TO REGISTER
POST   | http://localhost:3000/dev/sign-up 
```
  request: {"email": "11pepdddper@dad.asda", "password": "pepper"}
  response: {"id": 1,"accessToken": "token", "refreshToken": "token"}
```

ROUTE TO LOGIN
POST   | http://localhost:3000/dev/sign-in                         
  request: {"email": "11pepdddper@dad.asda", "password": "pepper"}
  response: {"id": 1,"accessToken": "token", "refreshToken": "token"} 

ROUTE TO REFRESH TOKENS
GET    | http://localhost:3000/dev/refresh                         
  request: none
  response: none
  
ROUTE TO CHECK YOUR PROFILE
GET    | http://localhost:3000/dev/profile                         
  request: none
  response: {"userId": "id","userEmail": "email", "userUrls": UrlsItem[]}

ROUTE TO CREATE SHORTLINK
POST   | http://localhost:3000/dev                                 
  request: {"originalUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "disposable": false, "expiresAt": 1}
  response: {"success": true,"data": {"fullUrl": "http://localhost:3000/dev/id", "urlId": "url-id"}}

ROUTE TO REDIRECT FROM SHORTLINK TO ORIGIN LINK (response from http://localhost:3000/dev)
GET    | http://localhost:3000/dev/{shortedUrl}                    
  request: none
  response: redirect

ROUTE TO DELETE SHORTLINK
DELETE | http://localhost:3000/dev/deactivateURL                   
  request: {"linkToDeactivate": "http://localhost:3000/dev/id"}
  response: {"id": "url-id"}
