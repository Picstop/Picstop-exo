# Picstop

To start server:

	yarn run dev

Setup Redis with homebrew:
	
install:

	brew install redis
	
start server:

	brew services start redis
		
start redis server upon computer boot:

	ln -sfv /usr/local/opt/redis/*.plist ~/Library/LaunchAgents

.env vars:

	MONGO_URL=
	AWS_SECRET=
	BUCKET_NAME=
	REDIS_PORT=
	REDIS_HOST=
	REDIS_PASSWORD=
	REDIS_SECRET=
	REDIS_NAME= 
	REDIS_AGE=
	NODE_ENV= development || production
	LOGIN_USER=support@picstopapp.us


	
