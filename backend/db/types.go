package db

type CreateUser struct {
	Username string `json:"username" validate:"required,alphanum,min=3,max=30"`
	Password string `json:"password" validate:"required"`
}

func (u *CreateUser) IntoUser() User {
	user := User{
		Username: u.Username,
	}
	user.SetPassword(u.Password)
	return user
}
