### API

[x] User registration
[x] Get user profiles
[ ] Update user profile
[x] Delete user profile
[x] Login
[x] Logout

### Stack

[x] pg + ORM (local)
[x] docker-compose (db)

## [x] L1 Tasks

1. Registration DTO

```json
{
  "login": "login",
  "email": "email",
  "password": "qwerty",
  "age": 25,
  "description": "up to 1k symbols"
}
```

2. Acc token + Refresh token (sessions)
3. Login (new tokens)
4. Logout (close session)
5. /profile/me - all fields

## [x] L2 Tasks

1. Authorized users should be able to get all users' profiles (/w pagination)

## [x] L3 Tasks

1. Swagger documentation
2. Tests e2e