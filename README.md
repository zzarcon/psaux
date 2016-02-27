# psaux [![Build Status](https://travis-ci.org/zzarcon/psaux.svg?branch=master)](https://travis-ci.org/zzarcon/psaux) [![npm version](https://badge.fury.io/js/psaux.svg)](https://badge.fury.io/js/psaux) [![Dependency Status](https://david-dm.org/zzarcon/psaux.svg)](https://david-dm.org/zzarcon/psaux) [![npm license](https://img.shields.io/npm/l/awesome-badges.svg)](https://www.npmjs.org/package/awesome-badges)
  > Process status in Node.js as you've always wanted

Promise oriented and lightweight Javascript utility for getting info about the processes runing in your machine.
It is designed to give you a friendly api for filter within all of them.

# Install

`$ npm install psaux --save`

# Usage 

Display the `user`, `pid`, `cpu` and `mem` of all the running processes:

```javascript
const psaux = require('psaux');

psaux().then(list => {  
  list.forEach(ps => {
    console.log(ps.user, ps.pid, ps.cpu, ps.mem);
  });
});
```

Find a concrete process using his **pid**

```javascript
psaux().then(list => {  
  let chrome = list.query({pid: 12345});

  console.log('Google chrome is using ' + chrome.cpu + '% of CPU and ' + chrome.mem + '% of memory');
});

```
Display inefficient processes started from the `root` user.

```javascript
psaux().then(list => {  
  let inefficient = list.query({
    user: 'root',
    mem: '>5'
  });

  console.log('Processes started by root and using more that 5% of memory');
});
```

Search for a process containing the passed string (very useful if you don't know the pid)

```javascript
psaux().then(list => {  
  let chrome = list.query({command: '~chrome'});
  
  if (chrome) {
    console.log('Chrome process found!', chrome);
  }
}); 
```

# Filters

You can filter by every property of the returned objects using the **query** method. Also you can create complex filters if needed:

```javascript
list.query({
  user: 'john',
  mem: '>2 <10',
  vsz: '>4000000',
  command: '~Sublime Text'
});
```

* `>` Greater than: `>5`
* `<` Lower than: `<5`
* `~` Contains: `~Chrome`

# Properties

The properties you can access are basically the same listed in the `ps` command:

* **user**: user owning the process
* **pid**: process ID
* **cpu**: It is the CPU time used divided by the time the process has been running.
* **mem**: ratio of the process’s resident set size to the physical memory on the machine
* **vsz**: virtual memory usage of entire process (in KiB)
* **rss**: resident set size, the non-swapped physical memory that a task has used (in KiB)
* **tt**: controlling tty (terminal)
* **stat**: multi-character process state
* **started**: starting time or date of the process
* **time**: cumulative CPU time
* **command**: command with all its arguments

# Supported platforms

The module currently supports Mac OS, Linux and Windows.
