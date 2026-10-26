/* TransMind Nexus — Customer Recovery Agent policy and response helper.
   Integration contract: the AI endpoint should call classifyCustomerDissatisfaction()
   before pricing/booking generation, mark complaint cases for human review, and run
   validateCustomerRecoveryReply() before returning any response.
*/
(function (root) {
  'use strict';
  const complaintPattern = /(tidak puas|kurang puas|kecewa|mengecewakan|pelayanan buruk|layanan buruk|komplain|keluhan|dissatisfied|disappointed|bad service|poor service|complaint|complain|refund|pengembalian dana|minta uang kembali)/i;
  const urgentPattern = /(kecelakaan|cedera|terluka|darurat|ancaman keselamatan|accident|injured|emergency|unsafe)/i;
  const humanPattern = /(refund|pengembalian dana|kompensasi|diskon khusus|sengketa pembayaran|kecelakaan|cedera|kontrak|legal|cancel booking|batalkan booking)/i;

  function classifyCustomerDissatisfaction(message) {
    const text = String(message || '');
    const complaint = complaintPattern.test(text);
    return {
      complaint,
      urgent: complaint && urgentPattern.test(text),
      humanReviewRequired: complaint || humanPattern.test(text),
      category: urgentPattern.test(text) ? 'safety' :
        /(refund|pengembalian dana|kompensasi|pembayaran|payment)/i.test(text) ? 'payment_or_refund' :
        /(terlambat|telat|menunggu|late|delay)/i.test(text) ? 'delay' :
        /(mobil|kendaraan|vehicle|kondisi)/i.test(text) ? 'vehicle_or_service' : 'general_complaint'
    };
  }

  function buildEmpatheticComplaintReply(message) {
    const text = String(message || '').trim();
    const triage = classifyCustomerDissatisfaction(text);
    if (!triage.complaint) return null;
    if (triage.urgent) {
      return 'Saya turut prihatin mendengar situasi ini. Keselamatan Anda yang utama. Jika ada bahaya langsung atau seseorang terluka, segera hubungi layanan darurat setempat dan pindah ke tempat aman bila memungkinkan. Jangan menunggu balasan chat ini. Saya akan menandai kasus ini untuk segera ditinjau oleh tim Transmind. Setelah aman, beri tahu kami secara singkat apa yang terjadi—hindari mengirim data identitas atau pembayaran yang sensitif.';
    }
    return 'Saya turut prihatin mendengar pengalaman Anda kurang memuaskan. Terima kasih sudah memberi tahu kami. Saya memahami hal ini bisa membuat kecewa dan kami ingin menindaklanjutinya dengan serius. Boleh ceritakan secara singkat apa yang terjadi dan kapan layanan atau pemesanan berlangsung? Jika ada nomor booking, Anda boleh membagikannya, tetapi jangan kirim kata sandi, OTP, data kartu, atau informasi pembayaran sensitif. Saya akan meneruskan keluhan ini kepada tim Transmind untuk ditinjau. Saya tidak ingin menjanjikan refund atau kompensasi sebelum faktanya diperiksa.';
  }

  function validateCustomerRecoveryReply(reply, message) {
    const output = String(reply || '');
    const triage = classifyCustomerDissatisfaction(message);
    const unsupportedPromise = /(pasti kami refund|refund pasti|pasti diganti|kompensasi pasti|kami jamin uang kembali|guaranteed refund|definitely refund)/i.test(output);
    return {
      valid: !triage.complaint || (output.length > 40 && !unsupportedPromise),
      humanReviewRequired: triage.humanReviewRequired,
      urgent: triage.urgent,
      category: triage.category,
      issues: unsupportedPromise ? ['unsupported_compensation_promise'] : []
    };
  }

  root.TransmindCustomerRecoveryAgent = {
    classifyCustomerDissatisfaction,
    buildEmpatheticComplaintReply,
    validateCustomerRecoveryReply
  };
})(typeof window !== 'undefined' ? window : globalThis);
