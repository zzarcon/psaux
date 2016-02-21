const execa = require('execa');

module.exports = options => {
  return new Promise((resolve, reject) => {
    execa('ps', ['aux']).then(result => {
      var processes = result.stdout.split('\n');

      //Remove header
      processes.shift();
      processes = processes.reduce(parseProcesses, []);
      
      processes.query = query;

      resolve(processes);
    });
  });
}

/**
 * Normalizes the process payload into a readable object.
 * 
 * @param  {Array} list 
 * @param  {Array} ps   
 * @return {Array}      
 */
function parseProcesses(list, ps) {
  var p = ps.split(/ +/);

  list.push({
    user: p[0],
    pid: p[1], 
    cpu: parseFloat(p[2]),
    mem: parseFloat(p[3]),
    vsz: p[4],
    rss: p[5],
    tt: p[6],
    stat: p[7],
    started: p[8],
    time: p[9],
    command: p.slice(10).join(' ')
  });

  return list;
}

/**
 * Return elements that match a certain query:
 *
 * @example
 *   list.query({
 *     user: 'root',
 *     cpu: '>10',
 *     mem: '>5 <10',
 *     command: '~chrome'
 *   })
 * 
 * @param  {Object} q 
 * @return {Array}   
 */
function query(q) {
  var filter = Object.keys(q);
  var isValid;
  var valid;
  var val;

  return this.reduce((list, ps) => {
    isValid = filter.every(key => {
      val = q[key];
      valid = true;

      if (typeof val === 'string') {
        if (val.indexOf('<') > -1) {
          valid = ps[key] < cleanValue(val, '<');
        }

        if (valid && val.indexOf('>') > -1) {
          valid = ps[key] > cleanValue(val, '>');
        }

        if (valid && val.indexOf('~') > -1) {
          valid = ps[key].indexOf(q[key].replace('~', '')) > -1; 
        }
      } else {
        valid = ps[key] === val;
      }

      return valid;
    });

    if (isValid) list.push(ps);

    return list;
  }, []);
}

/**
 * Return the value for a certain condition
 *
 * @example
 *   cleanValue('foo <100', '<') == 100
 *   cleanValue('>5 <1 bar', '>') == 5
 *   
 * @param  {String} val  
 * @param  {String} char 
 * @return {Float}      
 */
function cleanValue(val, char) {
  var num;
  var conditions = val.split(' ');
  var i = 0;

  while (!num && i < conditions.length) {
    if (conditions[i].indexOf(char) > -1) {
      num = conditions[i].replace(/<|>|~/g, '');
    }
    i++;
  }

  return parseFloat(num);
}