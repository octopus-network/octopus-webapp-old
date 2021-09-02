import React from 'react';

interface Props {
  width: number;
  height: number;
}

class Ball extends React.Component<Props> {
  canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

  til = 1;
  cnt = 0;
  num = 4;

  xMid = 0;
  yMid = 0;
  alph = 0.8;
  grav = -1;

  ang = 0;
  sp = 2 * Math.PI / 360;
  _arr: any = {};
  dump: any = {};

  spX = 0.1;
  spY = 0.1;
  spZ = 0.1;

  pov = 100;
  psz = 4;
  dth = -750;

  private isFullyMounted: boolean = false;

  static defaultProps = {
    width: 320,
    height: 320
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.animate(this.canvasRef.current);
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  public set isMounted(status: boolean) {
    this.isFullyMounted = status;
  }

  public get isMounted() {
    return this.isFullyMounted;
  }

  animate(c: HTMLCanvasElement) {
    window.requestAnimationFrame(() => {
      if (this.isMounted) {
        this.animate(c);
      }
    });
    this.cnt++;
    let p: any;
    let width = c.width;
    let height = c.height;

    let rad = width;
    let $ = c.getContext('2d');
    let midX = width / 2, midY = height / 2;
    let zMid = -3 - rad;
    if (this.cnt >= this.til) {
      this.cnt = 0;
      for (let i = 0; i < this.num; i++) {
        let theta  = Math.random() * 2 * Math.PI;
        let phi = Math.acos(Math.random() * 2 - 1);
        let _x = rad * Math.sin(phi) * Math.cos(theta);
        let _y = rad * Math.sin(phi) * Math.sin(theta);
        let _z = rad * Math.cos(phi);

        p = this.add(_x, this.yMid + _y, zMid + _z, 0.005 * _x, 0.002 * _y, 0.002 * _z);

        p.a = 120;
        p.b = 120;
        p.c = 460;
        p.va = 0;
        p.vb = this.alph;
        p.vc = 0;
        p.rem = 120 + Math.random() * 20;
        p.mvX = 0;
        p.mvY = this.grav;
        p.mvZ = 0;
      }
      p = this._arr.first;
    }
    this.ang = (this.ang + this.sp) + (2 * Math.PI);
    let sin = Math.sin(this.ang);
    let cos = Math.cos(this.ang);

    $.clearRect(0, 0, width, height);

    p = this._arr.first;
    while (p != null) {
      let pnxt = p.next; 
      p.go++;
      // if (p.go > p.rem) {
      //   p.vx += p.mvX + this.spX + (Math.random() * 2 - 1);
      //   p.vy += p.mvY + this.spY * (Math.random() * 2 - 1);
      //   p.vz += p.mvZ + this.spZ * (Math.random() * 2 - 1);
      //   p.x += p.vx;
      //   p.y += p.vy;
      //   p.z += p.vz;
      // }
      let rotX = cos * p.x + sin * (p.z - zMid);
      let rotZ = -sin * p.x + cos * (p.z - zMid) + zMid;
      let m = this.pov / (this.pov - rotZ);
      p.px = rotX * m + midX;
      p.py = p.y * m + midY;
      if (p.go < p.a + p.b + p.c) {
        if (p.go < p.a) {
          p.alpha = (p.vb - p.va) / p.a * p.go + p.va;
        } else if (p.go < p.a + p.b) {
          p.alpha = p.vb/2;
        } else if (p.go < p.a + p.b + p.c) {
          p.alpha = (p.vc - p.vb) / p.c * (p.go - p.a - p.b) + p.vb;
        } else {
          p.end = true;
        }
      }
      let rng = (p.px > width) || (p.px < 0) || (p.py < 0) || 
        (p.py > height) || (rotZ > (this.pov - 2));
      if (rng || p.end) {
        this.fin(p);
      }
      let dalph = (1 - rotZ / this.dth);
      dalph = (dalph > 1) ? 1 : ((dalph < 0) ? 0 : dalph);
      $.fillStyle = `rgba(120, 120, 200, ${p.alpha})`;
      $.beginPath();
      $.fillRect(p.px, p.py, m * this.psz, m * this.psz);
      p = pnxt;
    }
  }

  add(_x, _y, _z, vx0, vy0, vz0) {
    let np;
    if (this.dump.first != null) {
      np = this.dump.first;
      if (np.next != null) {
        this.dump.first = np.next;
        np.next.prev = null;
      } else {
        this.dump.first = null;
      }
    } else {
      np = {};
    }

    if (this._arr.first == null) {
      this._arr.first = np;
      np.prev = null;
      np.next = null;
    } else {
      np.next = this._arr.first;
      this._arr.first.prev = np;
      this._arr.first = np;
      np.prev = null;
    }

    np.x = _x;
    np.y = _y;
    np.z = _z;
    np.vx = vx0;
    np.vy = vy0;
    np.vz = vz0;
    np.go = 0;
    np.end = false;
    np.rt = Math.random() < 0.5;

    return np;
  }

  fin(p) {
    if (this._arr.first == p) {
      if (p.next != null) {
        p.next.prev = null;
        this._arr.first = p.next;
      } else {
        this._arr.first = null;
      }
    } else {
      if (p.next == null) {
        p.prev.next = null;
      } else {
        p.prev.next = p.next;
        p.next.prev = p.prev;
      }
    }
    if (this.dump.first == null) {
      this.dump.first = p;
      p.prev = null;
      p.next = null;
    } else {
      p.next = this.dump.first;
      this.dump.first.prev = p;
      this.dump.first = p;
      p.prev = null;
    }
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas ref={this.canvasRef} width={width} height={height}></canvas>
    )
  }
}

export default Ball;