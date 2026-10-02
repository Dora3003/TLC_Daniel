import icone from '../assets/autopark-icon.png';

export function MarcaAutoPark({ className = 'marca-redonda' }: { className?: string }) {
  return (
    <p className={className} aria-hidden="true">
      <img src={icone} alt="" width={48} height={48} />
    </p>
  );
}
