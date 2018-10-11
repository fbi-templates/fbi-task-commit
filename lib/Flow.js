// class ES6 {
//   constructor () {
//     console.log(this.value)
//   }
// }

// class ES5 {
//   constructor () {
//     this.value = 123
//   }

//   log () {
//     console.log('ES5')
//   }
// }

// var e5 = new ES5()
// Object.setPrototypeOf(ES6.prototype, e5)
// var e6 = new ES6()
// console.log('instance of ES5:', e6 instanceof ES5)
// console.log('instance of ES6:', e6 instanceof ES6)
// console.log('es6 value: ', e6.value)
// e5.value = 'newValue'
// console.log('es6 value: ', e6.value)

// e5.log()
// e6.log()

class Flow {
  constructor (x) {
    this.value = 123
    this.x = x
  }

  get configs () {
    return 'ppp'
  }

  log () {
    console.log(this.x)
  }
}

class MyFlow {
  constructor () {
    super('xxx')
    // console.log(this.configs)
    this.x = 'xxxxxxxx'
  }
}

const flow = new Flow()
Object.setPrototypeOf(MyFlow.prototype, flow)

//
const myFlow = new MyFlow()

myFlow.log()

// console.log(Object.keys(myFlow))
