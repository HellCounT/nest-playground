
### API

[x] User registration
[ ] Get user profiles
[ ] Update user profile
[ ] Delete user profile
[ ] Login
[ ] Logout

### Stack

[ ] pg + ORM (local)
[ ] docker-compose (db)

## [ ] L1 Tasks

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

## [ ] L2 Tasks

1. Authorized users should be able to get all users' profiles (/w pagination)

## [ ] L3 Tasks

1. Swagger documentation
2. Tests e2e