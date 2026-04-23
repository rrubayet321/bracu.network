# bracu.network
A webring and student directory for BRAC University students and alumni.

## Join via Web Form
Visit [bracu.network/join](https://bracu.network/join) and fill out the application form. You will be reviewed and added to the directory shortly. No technical knowledge required!

## Embed the Webring Widget
To show you are part of the network, add this snippet to your personal website:

```html
<script src="https://bracu.network/embed.js"
        data-webring
        data-user="your-slug-here">
</script>
```

This will render a small navigation bar linking to the previous and next member in the ring.

## Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/bracu-network.git
   cd bracu-network
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

4. **Run development server**
   ```bash
   npm run dev
   ```
