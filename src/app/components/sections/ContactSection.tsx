import ContactForm from '../ContactForm';

export default function ContactSection() {
  return (
    <section id="contact" className="min-h-screen">
      <div className="mx-auto max-w-2xl text-center mb-8">
        <h2 data-rail-anchor className="text-4xl md:text-5xl font-semibold text-white">Get in Touch</h2>
        <p className="mt-2 text-white/80">Feel free to reach out if you’d like to work together or just say hi.</p>
      </div>
      <ContactForm />
    </section>
  );
}
