require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_OBJECT_ID = 'aaaaaaaaaaaa' // 12 byte string


describe('Message API endpoints', () => {
    beforeEach((done) => {
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: SAMPLE_OBJECT_ID
        })
        sampleUser.save()
        .then(() => {
            const sampleMessage = new Message({
                title: 'mytitle',
                body: 'mybody',
                author: sampleUser._id,
                _id: SAMPLE_OBJECT_ID
            })
            sampleMessage.save()
            .then(() => {
                done()
            })
        })
    })

    afterEach((done) => {
        // Delete sample message, then sample user.
        Message.deleteMany({ title: ['mytitle', 'anothertitle'] })
        .then(() => {
            User.deleteOne({ username: ['myuser'] })
            .then(() => {
                done()
            })
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_OBJECT_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an("object")
            expect(res.body.title).to.equal('mytitle')
            expect(res.body.body).to.equal('mybody') 
            done()
        })
    })


    it('should post a new message', (done) => {
        chai.request(app)
          .post('/messages')
          .send({ title: 'anothertitle', body: 'anotherbody', author: SAMPLE_OBJECT_ID })
          .end((err, res) => {
            if (err) { done(err) }
            expect(res.body).to.be.an("object")
            expect(res.body).to.have.property('title', 'anothertitle')
            expect(res.body).to.have.property('body', 'anotherbody')
            
            Message.findOne({title: 'anothertitle'}).then(message => {
              expect(message).to.be.an("object")
              done()
            })
          })
      })
      
      it('should update a message', (done) => {
        chai.request(app)
          .put(`/messages/${SAMPLE_OBJECT_ID}`)
          .send({ title: 'anothertitle' })
          .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an("object")
            expect(res.body.message).to.have.property('title', 'anothertitle')
            done()
          })
      })
      
      it('should delete a message', (done) => {
        chai.request(app)
          .delete(`/messages/${SAMPLE_OBJECT_ID}`)
          .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal('Successfully deleted.')
      
            Message.findOne({ title: 'mytitle' }).then(message => {
              expect(message).to.equal(null)
              done()
            })
          })
      })
})
