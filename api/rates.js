const { getRates } = require('../lib/rates');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');
  try {
    const data = await getRates();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({
      error: 'Kunde inte hämta valutakurser just nu. Försök igen om en liten stund.',
      detail: err.message,
    });
  }
};
