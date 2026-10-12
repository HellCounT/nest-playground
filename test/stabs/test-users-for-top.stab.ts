export const testUsersForTop = {
  valid1: {
    login: 'top-valid-1',
    email: 'top-valid-1@test.com',
    password: 'qwerty123',
    age: 25,
    description: 'Backend developer',
  },

  valid2: {
    login: 'top-valid-2',
    email: 'top-valid-2@test.com',
    password: 'qwerty123',
    age: 30,
    description: 'Frontend developer',
  },

  onlyTwoAvatars: {
    login: 'top-two-avatars',
    email: 'top-two-avatars@test.com',
    password: 'qwerty123',
    age: 27,
    description: 'Only two avatars',
  },

  noDescription: {
    login: 'top-no-description',
    email: 'top-no-description@test.com',
    password: 'qwerty123',
    age: 28,
    description: '   ',
  },

  tooYoung: {
    login: 'top-too-young',
    email: 'top-too-young@test.com',
    password: 'qwerty123',
    age: 13,
    description: 'Too young',
  },

  deletedAvatar: {
    login: 'top-deleted-avatar',
    email: 'top-deleted-avatar@test.com',
    password: 'qwerty123',
    age: 29,
    description: 'Has deleted avatar',
  },
};
