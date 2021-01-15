const {
    expect,
} = require('chai');
let request = require('supertest');
const faker = require('faker');

let uinfo;
let ouinfo;
let uid;
let ouid;

request = request('http://localhost:3000');
const myName = `${faker.name.firstName().toLowerCase()}.123`;
const myRealName = `${faker.name.firstName()} ${faker.name.lastName()}`;
const myEmail = faker.internet.email();
const myPassword = `${faker.name.firstName()}123$$`;

const otherName = `${faker.name.firstName().toLowerCase()}.123`;
const otherRealName = `${faker.name.firstName()} ${faker.name.lastName()}`;
const otherEmail = faker.internet.email();
const otherPassword = `${faker.name.firstName()}123$$`;
console.log(`${myName} , ${myRealName} , ${myEmail} , ${myPassword}`);
console.log(`${otherName} , ${otherRealName} , ${otherEmail} , ${otherPassword}`);

describe('Testing PicStop...', () => {
    describe('Making an account...', () => {
        it('returns success creating account', (done) => {
            request
                .post('/user/signup')
                .send({
                    email: myEmail,
                    username: myName,
                    name: myRealName,
                    password: myPassword,
                    password2: myPassword,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Successfully signed up.';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns success creating alternate account', (done) => {
            request
                .post('/user/signup')
                .send({
                    email: otherEmail,
                    username: otherName,
                    name: otherRealName,
                    password: otherPassword,
                    password2: otherPassword,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(201)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Successfully signed up.';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns failure creating account', (done) => {
            request
                .post('/user/signup')
                .send({
                    email: faker.internet.domainName,
                    username: 'dhffdjkfhfhsdfhsjssdfhsofjsiofjsofjof22*#$@)()@#()#@',
                    password: 'abc',
                    password2: 'a2r',
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
    describe('Logging In...', () => {
        it('returns success logging in', (done) => {
            request
                .post('/user/login')
                .send({
                    username: myName,
                    password: myPassword,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Logged in';
                })
                .end((err, res) => {
                    uinfo = res.header['set-cookie'];
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns success logging in', (done) => {
            request
                .post('/user/login')
                .send({
                    username: otherName,
                    password: otherPassword,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Logged in';
                })
                .end((err, res) => {
                    ouinfo = res.header['set-cookie'];
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns failure finding account', (done) => {
            request
                .post('/user/login')
                .send({
                    username: 'fakename',
                    password: myPassword,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500)
                .expect((res) => {
                    res.body.success = false;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns bad password', (done) => {
            request
                .post('/user/login')
                .send({
                    username: myName,
                    password: 'badpwd',
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .expect((res) => {
                    res.body.success = false;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
    describe('Returning User data...', () => {
        it('returns success getting details of other user', (done) => {
            request
                .get(`/user/get/${otherName}`)
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message.followers = [];
                    res.body.message.following = [];
                    res.body.message.followerRequests = [];
                    res.body.message.private = false;
                    res.body.message.blocked = [];
                    res.body.message.savedLocations = [];
                    res.body.message.email = myEmail;
                    res.body.message.username = myName;
                    res.body.message.name = myRealName;
                })
                .end((err, res) => {
                    ouid = res.body.message._id;
                    if (err) return done(err);
                    return done();
                });
        });
        it('returns success getting details of current user', (done) => {
            request
                .get('/user/')
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message.followers = [];
                    res.body.message.following = [];
                    res.body.message.followerRequests = [];
                    res.body.message.private = false;
                    res.body.message.blocked = [];
                    res.body.message.savedLocations = [];
                    res.body.message.email = myEmail;
                    res.body.message.username = myName;
                    res.body.message.name = myRealName;
                })
                .end((err, res) => {
                    uid = res.body.message._id;
                    if (err) return done(err);
                    return done();
                });
        });
    });
    describe('Social constructs(following etc.)...', () => {
        it('follow user', (done) => {
            request
                .post('/user/follow/')
                .send({
                    id: ouid,
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Successfully followed user';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        // it('accept follow request', (done) => { implement later
        //     request
        //         .post('/request/accept/')
        //         .send({
        //             id: uid,
        //         })
        //         .set('Cookie', ouinfo)
        //         .set('Accept', 'application/json')
        //         .expect('Content-Type', /json/)
        //         .expect(200)
        //         .expect((res) => {
        //             res.body.success = true;
        //             res.body.message = 'Successfully followed user';
        //         })
        //         .end((err, res) => {
        //             if (err) return done(err);
        //             return done();
        //         });
        // });
        // it('remove follow request', (done) => {
        //     request
        //         .post('/request/remove/')
        //         .send({
        //             id: uid,
        //         })
        //         .set('Cookie', ouinfo)
        //         .set('Accept', 'application/json')
        //         .expect('Content-Type', /json/)
        //         .expect(200)
        //         .expect((res) => {
        //             res.body.success = true;
        //             res.body.message = 'Successfully followed user';
        //         })
        //         .end((err, res) => {
        //             if (err) return done(err);
        //             return done();
        //         });
        // });
        it('unfollow user', (done) => {
            request
                .post('/user/unfollow/')
                .send({
                    id: ouid,
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Successfully unfollowed user';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        it('block user', (done) => {
            request
                .post('/user/block/')
                .send({
                    id: ouid,
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = `Successfully blocked user${ouid}`;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        it('unblock user', (done) => {
            request
                .post('/user/unblock/')
                .send({
                    id: ouid,
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = `Successfully unblocked user${ouid}`;
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
    describe('Updating Info...', () => {
        it('change name', (done) => {
            request
                .patch('/user/username/')
                .send({
                    username: `${faker.name.firstName()}.egg`,
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Successfully updated username';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
        // it('reset password', (done) => { how will we do this?
        //     request
        //         .post('/user/forgot/')
        //         .send({
        //             email: myEmail,
        //         })
        //         .set('Cookie', uinfo)
        //         .set('Accept', 'application/json')
        //         .expect('Content-Type', /json/)
        //         .expect(200)
        //         .expect((res) => {
        //             res.body.success = true;
        //             res.body.message = `Successfully unblocked user${ouid}`;
        //         })
        //         .end((err, res) => {
        //             console.log(res.body);
        //             if (err) return done(err);
        //             return done();
        //         });
        // });
    });
    describe('Logging out...', () => {
        it('create location', (done) => {
            request
                .post('/locations/location')
                .send({
                    lat: (Math.random() * (180 + 180) - 180).toFixed(3) * 1,
                    long: (Math.random() * (180 + 180) - 180).toFixed(3) * 1,
                    name: faker.name.firstName(),
                })
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Logged out';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
    describe('Logging out...', () => {
        it('returns success logging out', (done) => {
            request
                .post('/user/logout')
                .set('Cookie', uinfo)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect((res) => {
                    res.body.success = true;
                    res.body.message = 'Logged out';
                })
                .end((err, res) => {
                    if (err) return done(err);
                    return done();
                });
        });
    });
});
