import { HiggsfieldClient } from '@higgsfield/client';

async function test() {
  const hf = new HiggsfieldClient();
  try {
    const styles = await hf.getSoulStyles();
    console.log('✓ Connexion Higgsfield OK');
    console.log('  Soul styles disponibles:', styles.length);
    if (styles.length > 0) console.log('  Premier style:', styles[0].name);
  } catch (err: any) {
    console.error('Erreur:', err?.name, '—', err?.message, err?.statusCode ? `(${err.statusCode})` : '');
    if (err?.responseData) console.log('  Détail API:', JSON.stringify(err.responseData).slice(0, 200));
  } finally {
    hf.close();
  }
}

test();
