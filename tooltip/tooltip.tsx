import React, { Component } from 'react';

export interface TooltipProps {
  icon: string;
  text: any;
  sticky: boolean;
  location: string;
}
interface TooltipState {
  sensitivity: number;
  interval: number;
  hidden: boolean;
  src: string;
  overElement: boolean;
  prevSpeed: {
    prevX: number;
    prevY: number;
    prevTime: number;
  };
  lastSpeed: {
    lastX: number;
    lastY: number;
    lastTime: number;
  };
  isHover: boolean;
  locationState: string;
}

export default class Tooltip extends Component<TooltipProps, TooltipState> {
  private tooltip = React.createRef<HTMLButtonElement>();

  private checkSpeed: any;

  private wrapperRef: any;
  /**
   *
   * @param props ожидаем в пропс icon, содержимое подсказки(text), sticky
   * @param state задаем чувствительность, интервал,
   * скрытность, скорость для измерения задержки, находится ли над элементом
   * задаем бинды для отлавливания клика снаружи
   */

  constructor(props: TooltipProps) {
    super(props);
    this.state = {
      sensitivity: 0.1,
      interval: 100,
      hidden: true,
      src: '',
      overElement: false,
      prevSpeed: { prevX: 0, prevY: 0, prevTime: Date.now() },
      lastSpeed: { lastX: 0, lastY: 0, lastTime: Date.now() },
      isHover: false,
      locationState: '',
    };
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  /**
   * подгружаем необходимую картинку
   * добавлять слушателя на клик снаружи
   * добавляем слушателя на скролл
   */
  componentDidMount() {
    const { icon } = this.props;
    this.loadImage(icon);
    document.addEventListener('mousedown', this.handleClickOutside);
    window.addEventListener('scroll', this.handleScroll);
  }

  /**
   * удаляем слушателя на клик снаружи
   * даляем слушателя на скролл
   */
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('scroll', this.handleScroll);
  }

  /**
   *
   * @param event передаем mouseevent наведения
   * задаем начальную скорость при первом наведении
   * задаем интервал для сравнения будущей скорости
   */
  handlerOver = (event: any): void => {
    const { overElement, interval } = this.state;
    if (overElement) {
      return;
    }
    const currentSpeed = {
      prevX: event.pageX,
      prevY: event.pageY,
      prevTime: Date.now(),
    };
    this.setState({ overElement: true });
    this.setState({ prevSpeed: currentSpeed });
    this.checkSpeed = setInterval(this.trackSpeed, interval);
  };

  /**
   * когда наведение убрано очищаем интервал,
   *  если элемент не должен быть липким
   */
  handlerOut = (): void => {
    const { isHover } = this.state;
    const { sticky } = this.props;
    this.setState({ overElement: false });
    clearInterval(this.checkSpeed);
    if (isHover) {
      if (!sticky) {
        this.setState({ hidden: true, isHover: false });
      }
    }
  };

  /**
   * задаем скорость каждого движения мыши на элементе
   * @param event слушатель на mouseevent move
   */
  handlerMove(event: React.MouseEvent) {
    const current = {
      lastX: event.pageX,
      lastY: event.pageY,
      lastTime: Date.now(),
    };

    this.setState({ lastSpeed: current });
  }

  /**
   * если липкий элемент вне области делаем его снова невидимым
   */
  handleClickOutside(ev: any) {
    const { sticky } = this.props;
    if (this.wrapperRef && !this.wrapperRef.contains(ev.target)) {
      if (sticky) {
        this.setState({ hidden: true });
      }
    }
  }

  handleScroll() {
    if (this.wrapperRef) {
      const coords = this.wrapperRef.getBoundingClientRect();
      if (coords.top < 0) this.setState({ locationState: 'bottom' });
    }
  }

  /**
   * устанавливаем обертку ref
   * @param node необходимый узел липкой подсказки
   */
  setWrapperRef(node: React.ReactNode) {
    this.wrapperRef = node;
  }

  /**
   * сравниваем скорость с первым наведением и каждым последующим
   * для измерения скорости между ними
   */
  trackSpeed = () => {
    let speed;
    const { prevSpeed, lastSpeed, sensitivity } = this.state;

    const { lastX, lastY, lastTime } = lastSpeed;
    const { prevX, prevY, prevTime } = prevSpeed;
    if (!lastTime || lastTime === prevTime) {
      speed = 0;
    } else {
      speed = Math.sqrt(((prevX - lastX) ** 2 + (prevY - lastY) ** 2) / (lastTime - prevTime));
    }
    if (speed < sensitivity) {
      this.setState({ isHover: true, hidden: false });
      clearInterval(this.checkSpeed);
    } else {
      this.setState({
        prevSpeed: {
          prevX: lastX,
          prevY: lastY,
          prevTime: lastTime,
        },
      });
    }
  };

  /**
   * динамически импортируем картинку
   * @param name
   */
  loadImage(name: string) {
    import(`../../../assets/${name}.svg`).then((img) => {
      this.setState({ src: img.default });
    });
  }

  /**
   * рендерим наш компонент
   * @returns нужный нам jsx
   */
  render() {
    const { hidden, src, locationState } = this.state;
    const { icon, text, sticky, location } = this.props;
    const cls = [];
    const currentTooltip = `${sticky ? 'sticky' : 'text'}`;
    cls.push(`Tooltip__${currentTooltip}`);
    cls.push(`Tooltip__${currentTooltip}__${location}`);
    if (locationState !== '') {
      cls.pop();
      cls.push(`Tooltip__${currentTooltip}__${locationState}`);
    }

    const target = this.tooltip.current;
    let top = 0;
    if (target) {
      const coords = target.getBoundingClientRect();
      top = coords.top - target.offsetHeight;
    }

    if (top < 0) {
      cls.pop();
      cls.push(`Tooltip__${currentTooltip}__bottom`);
    }
    return (
      <div className="Tooltip">
        <button
          ref={this.tooltip}
          onMouseOver={this.handlerOver}
          onMouseOut={this.handlerOut}
          onMouseMove={(event) => this.handlerMove(event)}
          onFocus={this.handlerOver}
          onBlur={this.handlerOut}
          className="Tooltip__button"
        >
          <img src={src} alt={icon} />
        </button>

        <span hidden={hidden} className={cls.join(' ')} ref={this.setWrapperRef}>
          {sticky ? <div>{text}</div> : <p>{text}</p>}
        </span>
      </div>
    );
  }
}
