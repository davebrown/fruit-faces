export default function Icon({ name, className = '', title, ...props }) {
  return <span {...props} className={`fa fa-${name} ${className}`} title={title}
    aria-hidden={title ? undefined : true}/>;
}
