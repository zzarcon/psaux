const execa = require('execa');
const os = require('os');

const platform = os.platform();
if (platform === 'freebsd') {
  module.exports = getFreeBSDProcess;
} else if (platform != "win32") {
  module.exports = getProcess;
} else {
  module.exports = getWinProcess;
}

function getWinProcess(options) {
  return new Promise((resolve, reject) => {
    execa('powershell', ['-noprofile',
      '$perf = get-wmiobject -class Win32_PerfFormattedData_PerfProc_Process;$proc = get-wmiobject -class win32_process -Property *;$TotalMem = get-wmiobject -class win32_computersystem | select -ExpandProperty TotalPhysicalMemory; $proc | foreach {    $procID = $_;    $procPerf = $perf | where {$_.creatingProcessID -eq $procID.ProcessID};    $procID | select name,        @{n="user"; e= {$user = $_.getOwner(); if($user.user){"{0}\{1}" -f $user.domain, $user.user}else {"System"}}},        @{n="command"; e={$_.CommandLine}},        @{n="pid";e={$_.ProcessID}},        @{n="memory (MB)";e={"{0:N3}" -f ($_.ws / 1mb)}},        @{n="memory (%)";e={"{0:N3}" -f ($_.ws / $TotalMem)}},        @{n="started";e={$_.converttoDateTime($_.CreationDate)}},        @{n="cpu"; e={$item = $_;$COUNT = 0;if($procPerf.percentProcessorTime){$procPerf.PercentProcessorTime | foreach {$count += $_};$percent = $count / $procPerf.PercentProcessorTime.length;"{0:N3}" -f [double]$percent;} else {"{0:N3}" -f 0}}}, @{n="vsz"; e={$_.VirtualSize}},@{n="rss"; e={$_.WorkingSetSize}},@{n="tt"; e={$_.SessionID}},@{n="time"; e={$_.KernelModeTime+ ($_.UserModeTime *10000)}}}'
    ]).then(({ stdout }) => {
      let processes = stdout.split('\r\n\r\n').map((result) => {
        return result.split('\r\n').map((prop) => {
          return prop.split(/\s+:\s/);
        }).reduce((proc, [ key, value ]) => {
          if (value === undefined) {
            // handle long commands that have been wrapped
            key = key.trim();
            if ('command' in proc) {
              proc['command'] += key;
            } else {
              proc['command'] = key;
            }
          } else {
            proc[key] = value;
          }
          return proc;
        }, {})
      }).slice(1, -1);
      processes = processes.reduce(parseWinProcesses, []);
      processes.query = query;
      resolve(processes);
    });
  });
}

function parseWinProcesses(list, ps) {
  // basic formatting
  const proc = {
    user: ps["user"],
    pid: ps["pid"],
    cpu: parseFloat(ps["cpu"]),
    mem: parseFloat(ps["memory (%)"]),
    name: ps["name"],
    vsz: ps["vsz"],
    rss: ps["rss"],
    tt: ps["tt"],
    time: ps["time"],
    command: ps["command"]
  };
  // adjust 'started' into Date
  let [
    month, date, year, hour, minutes, seconds, ampm
  ] = ps['started'].match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+) (\w+)/).slice(1);
  if (ampm === 'PM') { hour = parseInt(hour) + 12; }
  month = parseInt(month) - 1;
  ps['started'] = new Date(year, month, date, hour, minutes, seconds);
  // adjust command
  if (proc.command !== '') {
    proc.command = proc.command.replace('\\\\', '\\');
  }
  // append to list and return
  list.push(proc);
  return list;
}

function getFreeBSDProcess(options) {
  return new Promise((resolve, reject) => {
    execa('ps', ['auxww']).then(result => {
      var processes = result.stdout.split('\n');

      //Remove header
      processes.shift();
      processes = processes.reduce(parseProcesses, []);

      processes.query = query;

      resolve(processes);
    }); 
  });
}

function getProcess(options) {
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
