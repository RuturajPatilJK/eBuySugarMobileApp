'use client';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';

const TESTIMONIALS = [
    { id: 1, image: 'https://ebuysugar.com/image/aslam%20s%20p%20peringhat-sugars.jpg', name: 'Mr. ASLAM S P', company: 'Peringhat Sugars, Aluva, Kerala', content: 'eBuySugar platform has helped me in making the sugar purchase decisions easily and efficiently. It shows the best deals out there and only platform that provides insurance for the sugar which makes ebuy my first priority in sugar purchase. Also the support from the team is appreciable.', rating: 5 },
    { id: 2, image: 'https://ebuysugar.com/image/Singaravelu A.jpg', name: 'Mr. Singaravelu A.', company: 'ARC Agencies, Bangalore', content: 'eBuySugar.com helps in knowing all sugar factory rates on daily basis. It is beneficial to know prevailing best prices on daily basis. Trade on eBuySugar is so easy, fast and secure.', rating: 5 },
    { id: 3, image: 'https://ebuysugar.com/image/chirag panchmatia.jpg', name: 'Mr. Chirag Panchmatia', company: 'Chandrakant Shivjibhai, Nagpur', content: 'Never thought that buying and selling sugar would be so easy. Thanks to eBuySugar portal for making my sugar business so simplified. I can connect with new buyers at my fingertips. I get all the transactions and delivery updates on WhatsApp.', rating: 5 },
    { id: 4, image: 'https://ebuysugar.com/image/janeesh patel.jpg', name: 'Mr. Janeesh Patel', company: 'Samarpan Sugar, Ahmedabad', content: 'I am buying and selling sugar through eBuySugar mobile app. It\'s easy and convenient, and one of the best ways of trading sugar digitally. No default transactions yet. So it\'s a trustworthy platform.', rating: 5 },
    { id: 5, image: 'https://ebuysugar.com/image/nadaf.jpg', name: 'Mr. Samir Nadaf', company: 'Dhanlaxmi Transport, Belgaum', content: 'ट्रांसपोर्ट के सफल व्यापार के साथ जब डेढ़ साल पहले मैंने eBuySugar.com के साथ चीनी व्यापार की शुरुआत की तब न सिर्फ मेरा चीनी व्यापार डिजिटल हुआ था जिससे इसे मैनेज करना भी काफी आसान हुआ।', rating: 5 },
    { id: 6, image: 'https://ebuysugar.com/image/nemaram solanki.jpg', name: 'Shri Nemaram Solanki', company: 'Dhanlaxmi Sugar Agency, Gulbarga', content: 'eBuySugar.com से जुडना सुखद अनुभव है। चीनी खरीदना न सिर्फ आसान है बल्की फास्ट भी है। ये एकलौता ऐसा प्लेटफॉर्म है जो चीनी को 20 मिनट में डिलीवर करता है।', rating: 5 },
    { id: 7, image: 'https://ebuysugar.com/image/pg-medhe rajram ssk.jpg', name: 'P. G. Medhe', company: 'Chh. Rajaram Sugar Mill', content: 'I am very glad to mention here that I know JK Sugars and JK Enterprises since long. They started their sugar trading business at a very small scale and developed like anything following the important aspect of business such as honesty, hard working, professionalism as well as creation of good relations.', rating: 5 },
    { id: 8, image: 'https://ebuysugar.com/image/prakash phulwani.jpg', name: 'Shri Prakash Phulwani', company: 'Jay Ganesh Sugar Agency, Nagpur', content: 'मैं २ साल पहले eBuySugar.com से जुड़ा, तब से चीनी व्यापार का मेरा अनुभव कमल का रहा। ऑनलाइन पोर्टल से ट्रेड कन्फर्मेशन तुरंत आता है। मैंने काफी क्वांटिटी में eBuySugar के साथ चीनी व्यापार किया और मुझे इसका और भी ज्यादा फायदा मिला।', rating: 5 },
    { id: 9, image: 'https://ebuysugar.com/image/Rupesh-Dalal Trishi Enterprises.jpg', name: 'Rupesh Dalal', company: 'Tirshil Enterprises Pvt Ltd, Mumbai', content: '"If you buy or sell anything to anyone, should be risk free in terms of money and stock". I have got the same experience in dealing with JK sugars and JK Enterprises. Once you trade with them, forget everything about the trade and rest assured.', rating: 5 },
    { id: 10, image: 'https://ebuysugar.com/image/Mahakali sugars.jpg', name: 'Kumar Fulwani', company: 'Mahakali Sugars, Nagpur', content: 'From the last 20 years we have been doing business with you and we are glad that we have become so successful in our life by following your business rules and regulations and techniques.', rating: 5 },
    { id: 11, image: 'https://ebuysugar.com/image/Mukund Traders.jpg', name: 'Gopal Sharma', company: 'Mukund Transport Co., Hyderabad', content: 'जब से जेके इंटरप्राइजेस, जेके शुगर के संपर्क में हूं तब से मैंने यही देखा है के जीतू भाई ने इस एंपायर को खड़ा करने में कर्म को अपना शस्त्र बनाया। आज जेके इंटरप्राइजेज पूरे भारत में अपनी एक अलग पहचान बना चुका है।', rating: 5 },
    { id: 12, image: 'https://ebuysugar.com/image/sachin fulwani.jpg', name: 'Sachin Fulwani', company: 'Nagpur', content: 'I am writing to thank you for being our most trusted sugar house from last many years. We are delighted by the quality of your services and appreciate your responsiveness and professionalism in business. JK Sugars are very reliable.', rating: 5 },
    { id: 13, image: 'https://ebuysugar.com/image/shau Group.jpg', name: 'Maruti Patil', company: 'Shri Chh Shahu SSK Ltd, Kagal', content: 'We say JK Enterprise means name of trust. They always stick up & fulfill their commitments. Maintaining relationship beyond business.', rating: 5 },
    { id: 14, image: 'https://ebuysugar.com/image/NYP.jpg', name: 'N Y Patil (M.D.)', company: 'Hamidwada Sugar Mill', content: 'जे.के. एंटरप्रायझेस हे नांव म्हणजे साखर कारखानदारी शी जोडलेलं अतुट नातं. सर्वाना जे.के. म्हणजे मिञ, मार्गदर्शक, आणि बाजारपेठेची जाण असणार नेतृत्व आहे याचा लाभ आम्हाला वेळोवेळी होत आहे.', rating: 5 },
    { id: 15, image: 'https://ebuysugar.com/image/jayant sugars.jpg', name: 'Vaibhav Mohite', company: 'Jayant Sugars Ltd, Dharwadi', content: 'Thanks Sirji, It\'s my great pleasure to work with you and having a unbelievable experience. I hope our relationship is going to last longer. Thanks again.', rating: 5 },
    { id: 16, image: 'https://ebuysugar.com/image/vinay sangli.jpg', name: 'બાબુભાઈ મહેતા', company: 'વિજય ટ્રેડસઁ, સાંગલી', content: 'જે કે એન્ટરપ્રાઇઝ, જેના માલિક જીતુભાઇ, સાથે વષોઁ જુનો નાતો છે. સાકરનો ધંધો એમની સાથે કર્યો છે કરૂ પણ છું. મને આ ફમઁ ઊપર પુરો ભરોસો છે.', rating: 5 },
    { id: 17, image: 'https://ebuysugar.com/image/Babajan corporation.jpg', name: 'Babajan Corporation', company: 'Nanded', content: 'It was a great time spent with you and your company JK Enterprises for sugar trade and even in future it will be the same. Due to your support, cooperation, sharing your valuable time with me and friendly communication it is possible.', rating: 5 },
    { id: 18, image: 'https://ebuysugar.com/image/vijay kirtilal shah.jpg', name: 'Vijay Kirtilal Shah', company: 'Shah Nathalal Hathibhai, Kolhapur', content: 'JK, which was started with hard work, honesty, courage & future eyesight in business made you successful in all aspects. Keep it up.', rating: 5 },
    { id: 19, image: 'https://ebuysugar.com/image/Ramesh Jejani.jpg', name: 'Ramesh Jejani', company: 'Sugar Center, Nagpur', content: 'I landed in Kolhapur as a competitor from customer of JK. From day one Jitubhai helped me, guided me and supported me with great love and respect forever. In short I will say JK Enterprises, JK Sugars and family are the backbone of Sugar Center.', rating: 5 },
    { id: 20, image: 'https://ebuysugar.com/image/dipu jethanand.jpg', name: 'दीपू जेठानंद', company: 'जबलपुर', content: 'मैं जेके कोल्हापुर से 15 साल से काम कर रहा हूँ, कभी किसी भी प्रकार की कोई दिक्कत नहीं हुई जेके एक भरोसेमंद परिवार है। हम सब एक साथ हैं।', rating: 5 },
    { id: 21, image: 'https://ebuysugar.com/image/Maa sugar.jpg', name: 'Himanshu Sharma', company: 'Maa Trading Company, Kanpur', content: 'जेके ग्रूप के साथ काम करने का अनुभव ही अलग है। जेके ग्रूप ने आज तक कभी कोई सौदा होने के बाद मना नहीं किया। जितना भी स्टाफ़्फ़ है वो काफ़ी हेल्पफुल स्वभाव का है।', rating: 5 },
    { id: 22, image: 'https://ebuysugar.com/image/prakash hastimal pokharna.jpg', name: 'प्रकाश हस्तीमल पोखरणा', company: 'अहमदनगर', content: 'जेके शुगर्स और जेके इंटरप्राइजेस याने कि विश्वास की पूर्ण परम्परा। १००% प्यूयर भी और शुगर भी।', rating: 5 },
    { id: 23, image: 'https://ebuysugar.com/image/deepak gupta.jpg', name: 'Shri Deepak Gupta', company: 'Shrinath Sugar Broker, Indore', content: 'I am working with eBuySugar since 1.5 years. Buying and selling sugar on this platform is very easy. Hassle-free booking & delivery, their sell purchase records are commendable. Completely paperless. Saves time and money.', rating: 5 },
];

function StarRating({ rating }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#e5e7eb', fontSize: 14 }}>★</span>
            ))}
        </div>
    );
}

export default function TestimonialsPage() {
    return (
        <AppLayout title="Testimonials" showBack>
            <div style={{ padding: '12px 16px 32px', fontFamily: 'Signika, ui-sans-serif, system-ui, sans-serif' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg,#ef3837,#d92300)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: '0 4px 16px rgba(239,56,55,0.3)', textAlign: 'center' }}>
                    <p style={{ color: 'white', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>What Our Traders Say ⭐</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>Trusted by sugar mills & traders across India</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{TESTIMONIALS.length} testimonials</p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {TESTIMONIALS.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.6) }}
                            style={{ background: 'white', borderRadius: 16, padding: '18px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #f3f4f6' }}>
                                        <img src={t.image} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => {
                                                e.target.style.display = 'none';
                                                e.target.parentNode.style.background = `linear-gradient(135deg,hsl(${i * 50},65%,50%),hsl(${i * 50 + 30},65%,40%))`;
                                                e.target.parentNode.style.display = 'flex';
                                                e.target.parentNode.style.alignItems = 'center';
                                                e.target.parentNode.style.justifyContent = 'center';
                                                e.target.parentNode.style.color = 'white';
                                                e.target.parentNode.style.fontWeight = '900';
                                                e.target.parentNode.style.fontSize = '16px';
                                                e.target.parentNode.innerHTML = t.name.split(' ').map(w => w[0]).join('').slice(0, 2);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{t.name}</div>
                                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{t.company}</div>
                                    </div>
                                </div>
                                <StarRating rating={t.rating} />
                            </div>
                            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.content}"</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
