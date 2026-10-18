// ============================================================
// NOVAHUB — Bangladesh Location Data (Full)
// 8 Divisions, 64 Districts, 495+ Upazilas
// Format: "English (বাংলা)"
// ============================================================

window.LOCATION_DATA = {
    bangladesh: {
        code: 'bd',
        name: 'Bangladesh',
        nameBn: 'বাংলাদেশ',
        flag: '🇧🇩',
        phoneCode: '+880',
        
        labels: {
            level1: 'Division', level1Bn: 'বিভাগ',
            level2: 'District', level2Bn: 'জেলা',
            level3: 'Thana/Upazila', level3Bn: 'থানা/উপজেলা'
        },
        
        levels: {
            
            // ============================================================
            // 1. DHAKA DIVISION (ঢাকা বিভাগ) — 13 Districts
            // ============================================================
            'Dhaka (ঢাকা)': {
                
                'Dhaka (ঢাকা)': [
                    'Dhamrai (ধামরাই)', 'Dohar (দোহার)', 'Dhanmondi (ধানমন্ডি)', 'Keraniganj (কেরানীগঞ্জ)',
                    'Nawabganj (নবাবগঞ্জ)', 'Savar (সাভার)', 'Badda (বাড্ডা)',
                    'Cantonment (ক্যান্টনমেন্ট)', 'Chawkbazar (চকবাজার)', 'Demra (ডেমরা)',
                    'Gendaria (গেন্ডারিয়া)', 'Gulshan (গুলশান)',
                    'Hazaribagh (হাজারীবাগ)', 'Jatrabari (যাত্রাবাড়ী)', 'Kafrul (কাফরুল)',
                    'Kamrangirchar (কামরাঙ্গীরচর)', 'Khilgaon (খিলগাঁও)', 'Kotwali (কোতোয়ালি)',
                    'Lalbagh (লালবাগ)', 'Mirpur (মিরপুর)', 'Mohammadpur (মোহাম্মদপুর)',
                    'Motijheel (মতিঝিল)', 'Mugda (মুগদা)', 'New Market (নিউমার্কেট)',
                    'Pallabi (পল্লবী)', 'Paltan (পল্টন)', 'Ramna (রমনা)',
                    'Rampura (রামপুরা)', 'Sabujbagh (সবুজবাগ)', 'Shahbagh (শাহবাগ)',
                    'Shyampur (শ্যামপুর)', 'Sutrapur (সূত্রাপুর)', 'Tejgaon (তেজগাঁও)',
                    'Turag (তুরাগ)', 'Uttara (উত্তরা)', 'Uttarkhan (উত্তরখান)',
                    'Vatara (ভাটারা)', 'Wari (ওয়ারী)',
                    'Adabor (আদাবর)', 'Banani (বনানী)', 'Bangshal (বংশাল)',
                    'Bhashantek (ভাষানটেক)', 'Dakshinkhan (দক্ষিণখান)', 'Darus Salam (দারুস সালাম)',
                    'Hatirjheel (হাতিরঝিল)', 'Kadamtali (কদমতলী)', 'Kalabagan (কলাবাগান)',
                    'Khilkhet (খিলক্ষেত)', 'Sher-e-Bangla Nagar (শেরেবাংলা নগর)',
                    'Shahjahanpur (শাহজাহানপুর)', 'Biman Bandar (বিমানবন্দর)'
                ],
                
                'Faridpur (ফরিদপুর)': [
                    'Alfadanga (আলফাডাঙ্গা)', 'Bhanga (ভাঙ্গা)', 'Boalmari (বোয়ালমারী)',
                    'Charbhadrasan (চরভদ্রাসন)', 'Faridpur Sadar (ফরিদপুর সদর)',
                    'Madhukhali (মধুখালী)', 'Nagarkanda (নগরকান্দা)',
                    'Sadarpur (সদরপুর)', 'Saltha (সালথা)'
                ],
                
                'Gazipur (গাজীপুর)': [
                    'Gazipur Sadar (গাজীপুর সদর)', 'Kaliakair (কালিয়াকৈর)',
                    'Kaliganj (কালীগঞ্জ)', 'Kapasia (কাপাসিয়া)',
                    'Sreepur (শ্রীপুর)', 'Tongi (টঙ্গী)', 'Joydebpur (জয়দেবপুর)', 'Konabari (কোনাবাড়ী)',
                    'Pubail (পূবাইল)', 'Basan (বাসন)', 'Gachha (গাছা)'
                ],
                
                'Gopalganj (গোপালগঞ্জ)': [
                    'Gopalganj Sadar (গোপালগঞ্জ সদর)', 'Kashiani (কাশিয়ানী)',
                    'Kotalipara (কোটালীপাড়া)', 'Muksudpur (মুকসুদপুর)',
                    'Tungipara (টুঙ্গিপাড়া)'
                ],
                
                'Kishoreganj (কিশোরগঞ্জ)': [
                    'Austagram (অষ্টগ্রাম)', 'Bajitpur (বাজিতপুর)', 'Bhairab (ভৈরব)',
                    'Hossainpur (হোসেনপুর)', 'Itna (ইটনা)', 'Karimganj (করিমগঞ্জ)',
                    'Katiadi (কটিয়াদী)', 'Kishoreganj Sadar (কিশোরগঞ্জ সদর)',
                    'Kuliarchar (কুলিয়ারচর)', 'Mithamain (মিঠামইন)', 'Nikli (নিকলী)',
                    'Pakundia (পাকুন্দিয়া)', 'Tarail (তাড়াইল)'
                ],
                
                'Madaripur (মাদারীপুর)': [
                    'Kalkini (কালকিনি)', 'Madaripur Sadar (মাদারীপুর সদর)',
                    'Rajoir (রাজৈর)', 'Shibchar (শিবচর)', 'Dasar (ডাসার)'
                ],
                
                'Manikganj (মানিকগঞ্জ)': [
                    'Daulatpur (দৌলতপুর)', 'Ghior (ঘিওর)', 'Harirampur (হরিরামপুর)',
                    'Manikganj Sadar (মানিকগঞ্জ সদর)', 'Saturia (সাটুরিয়া)',
                    'Shivalaya (শিবালয়)', 'Singair (সিংগাইর)'
                ],
                
                'Munshiganj (মুন্সিগঞ্জ)': [
                    'Gazaria (গজারিয়া)', 'Lohajang (লৌহজং)',
                    'Munshiganj Sadar (মুন্সিগঞ্জ সদর)', 'Sirajdikhan (সিরাজদিখান)',
                    'Sreenagar (শ্রীনগর)', 'Tongibari (টঙ্গীবাড়ী)'
                ],
                
                'Narayanganj (নারায়ণগঞ্জ)': [
                    'Araihazar (আড়াইহাজার)', 'Bandar (বন্দর)',
                    'Narayanganj Sadar (নারায়ণগঞ্জ সদর)', 'Rupganj (রূপগঞ্জ)',
                    'Sonargaon (সোনারগাঁও)', 'Siddhirganj (সিদ্ধিরগঞ্জ)',
                    'Fatullah (ফতুল্লা)'
                ],
                
                'Narsingdi (নরসিংদী)': [
                    'Belabo (বেলাবো)', 'Monohardi (মনোহরদী)',
                    'Narsingdi Sadar (নরসিংদী সদর)', 'Palash (পলাশ)',
                    'Raipura (রায়পুরা)', 'Shibpur (শিবপুর)'
                ],
                
                'Rajbari (রাজবাড়ী)': [
                    'Baliakandi (বালিয়াকান্দি)', 'Goalandaghat (গোয়ালন্দঘাট)',
                    'Kalukhali (কালুখালী)', 'Pangsha (পাংশা)',
                    'Rajbari Sadar (রাজবাড়ী সদর)'
                ],
                
                'Shariatpur (শরীয়তপুর)': [
                    'Bhedarganj (ভেদরগঞ্জ)', 'Damudya (ডামুড্যা)',
                    'Gosairhat (গোসাইরহাট)', 'Naria (নড়িয়া)',
                    'Shariatpur Sadar (শরীয়তপুর সদর)', 'Zajira (জাজিরা)'
                ],
                
                'Tangail (টাঙ্গাইল)': [
                    'Basail (বাসাইল)', 'Bhuapur (ভূঞাপুর)', 'Delduar (দেলদুয়ার)',
                    'Dhanbari (ধনবাড়ী)', 'Ghatail (ঘাটাইল)', 'Gopalpur (গোপালপুর)',
                    'Kalihati (কালিহাতী)', 'Madhupur (মধুপুর)', 'Mirzapur (মির্জাপুর)',
                    'Nagarpur (নাগরপুর)', 'Sakhipur (সখিপুর)',
                    'Tangail Sadar (টাঙ্গাইল সদর)'
                ]
            },
            
            // ============================================================
            // 2. CHITTAGONG DIVISION (চট্টগ্রাম বিভাগ) — 11 Districts
            // ============================================================
            'Chittagong (চট্টগ্রাম)': {
                
                'Chattogram (চট্টগ্রাম)': [
                    'Anwara (আনোয়ারা)', 'Banshkhali (বাঁশখালী)', 'Boalkhali (বোয়ালখালী)',
                    'Chandanaish (চন্দনাইশ)', 'Fatikchhari (ফটিকছড়ি)',
                    'Hathazari (হাটহাজারী)', 'Lohagara (লোহাগাড়া)',
                    'Mirsharai (মীরসরাই)', 'Patiya (পটিয়া)', 'Rangunia (রাঙ্গুনিয়া)',
                    'Raozan (রাউজান)', 'Sandwip (সন্দ্বীপ)', 'Satkania (সাতকানিয়া)',
                    'Sitakunda (সীতাকুণ্ড)',
                    'Bakalia (বাকলিয়া)', 'Bayezid (বায়েজিদ)', 'Chandgaon (চাঁদগাও)',
                    'Double Mooring (ডবলমুরিং)', 'Halishahar (হালিশহর)',
                    'Kotwali (কোতোয়ালি)', 'Pahartali (পাহাড়তলী)',
                    'Panchlaish (পাঁচলাইশ)', 'Patenga (পতেঙ্গা)', 'Karnaphuli (কর্ণফুলী)',
                    'Khulshi (খুলশী)', 'Chawkbazar (চকবাজার)', 'Bandar (বন্দর)',
                    'Akbar Shah (আকবর শাহ)', 'Sadarghat (সদরঘাট)', 'EPZ (ইপিজেড)'
                ],
                
                "Cox's Bazar (কক্সবাজার)": [
                    "Chakaria (চকরিয়া)", "Cox's Bazar Sadar (কক্সবাজার সদর)",
                    'Kutubdia (কুতুবদিয়া)', 'Maheshkhali (মহেশখালী)',
                    'Pekua (পেকুয়া)', 'Ramu (রামু)', 'Teknaf (টেকনাফ)',
                    'Ukhia (উখিয়া)'
                ],
                
                'Rangamati (রাঙ্গামাটি)': [
                    'Bagaichhari (বাঘাইছড়ি)', 'Barkal (বরকল)',
                    'Belaichhari (বিলাইছড়ি)', 'Juraichhari (জুরাছড়ি)',
                    'Kaptai (কাপ্তাই)', 'Kawkhali (কাউখালী)', 'Langadu (লংগদু)',
                    'Naniarchar (নানিয়ারচর)', 'Rajasthali (রাজস্থলী)',
                    'Rangamati Sadar (রাঙ্গামাটি সদর)'
                ],
                
                'Bandarban (বান্দরবান)': [
                    'Alikadam (আলীকদম)', 'Bandarban Sadar (বান্দরবান সদর)',
                    'Lama (লামা)', 'Naikhongchhari (নাইক্ষ্যংছড়ি)',
                    'Rowangchhari (রোয়াংছড়ি)', 'Ruma (রুমা)', 'Thanchi (থানচি)'
                ],
                
                'Khagrachhari (খাগড়াছড়ি)': [
                    'Dighinala (দীঘিনালা)', 'Khagrachhari Sadar (খাগড়াছড়ি সদর)',
                    'Lakshmichhari (লক্ষ্মীছড়ি)', 'Mahalchhari (মহালছড়ি)',
                    'Manikchhari (মানিকছড়ি)', 'Matiranga (মাটিরাঙ্গা)',
                    'Panchhari (পানছড়ি)', 'Ramgarh (রামগড়)', 'Guimara (গুইমারা)'
                ],
                
                'Cumilla (কুমিল্লা)': [
                    'Barura (বরুড়া)', 'Brahmanpara (ব্রাহ্মণপাড়া)',
                    'Burichang (বুড়িচং)', 'Chandina (চান্দিনা)',
                    'Chauddagram (চৌদ্দগ্রাম)', 'Cumilla Sadar (কুমিল্লা সদর)',
                    'Daudkandi (দাউদকান্দি)', 'Debidwar (দেবিদ্বার)',
                    'Homna (হোমনা)', 'Laksam (লাকসাম)', 'Lalmai (লালমাই)',
                    'Meghna (মেঘনা)', 'Monohorgonj (মনোহরগঞ্জ)',
                    'Muradnagar (মুরাদনগর)', 'Nangalkot (নাঙ্গলকোট)',
                    'Titas (তিতাস)', 'Cumilla Sadar Dakshin (কুমিল্লা সদর দক্ষিণ)'
                ],
                
                'Noakhali (নোয়াখালী)': [
                    'Begumganj (বেগমগঞ্জ)', 'Chatkhil (চাটখিল)',
                    'Companiganj (কোম্পানীগঞ্জ)', 'Hatiya (হাতিয়া)',
                    'Kabirhat (কবিরহাট)', 'Noakhali Sadar (নোয়াখালী সদর)',
                    'Senbagh (সেনবাগ)', 'Sonaimuri (সোনাইমুড়ী)',
                    'Subarnachar (সুবর্ণচর)'
                ],
                
                'Feni (ফেনী)': [
                    'Chhagalnaiya (ছাগলনাইয়া)', 'Daganbhuiyan (দাগনভূঞা)',
                    'Feni Sadar (ফেনী সদর)', 'Fulgazi (ফুলগাজী)',
                    'Parshuram (পরশুরাম)', 'Sonagazi (সোনাগাজী)'
                ],
                
                'Lakshmipur (লক্ষ্মীপুর)': [
                    'Kamalnagar (কমলনগর)', 'Lakshmipur Sadar (লক্ষ্মীপুর সদর)',
                    'Raipur (রায়পুর)', 'Ramganj (রামগঞ্জ)', 'Ramgati (রামগতি)'
                ],
                
                'Chandpur (চাঁদপুর)': [
                    'Chandpur Sadar (চাঁদপুর সদর)', 'Faridganj (ফরিদগঞ্জ)',
                    'Haimchar (হাইমচর)', 'Haziganj (হাজীগঞ্জ)',
                    'Kachua (কচুয়া)', 'Matlab Dakshin (মতলব দক্ষিণ)',
                    'Matlab Uttar (মতলব উত্তর)', 'Shahrasti (শাহরাস্তি)'
                ],
                
                'Brahmanbaria (ব্রাহ্মণবাড়িয়া)': [
                    'Akhaura (আখাউড়া)', 'Ashuganj (আশুগঞ্জ)',
                    'Bancharampur (বাঞ্ছারামপুর)', 'Bijoynagar (বিজয়নগর)',
                    'Brahmanbaria Sadar (ব্রাহ্মণবাড়িয়া সদর)', 'Kasba (কসবা)',
                    'Nabinagar (নবীনগর)', 'Nasirnagar (নাসিরনগর)',
                    'Sarail (সরাইল)'
                ]
            },
            
            // ============================================================
            // 3. RAJSHAHI DIVISION (রাজশাহী বিভাগ) — 8 Districts
            // ============================================================
            'Rajshahi (রাজশাহী)': {
                
                'Rajshahi (রাজশাহী)': [
                    'Bagha (বাঘা)', 'Bagmara (বাগমারা)', 'Charghat (চারঘাট)',
                    'Durgapur (দুর্গাপুর)', 'Godagari (গোদাগাড়ী)',
                    'Mohanpur (মোহনপুর)', 'Paba (পবা)', 'Puthia (পুঠিয়া)',
                    'Rajshahi Sadar (রাজশাহী সদর)', 'Tanore (তানোর)',
                    'Boalia (বোয়ালিয়া)', 'Motihar (মতিহার)', 'Rajpara (রাজপাড়া)',
                    'Shah Makhdum (শাহ মখদুম)'
                ],
                
                'Bogra (বগুড়া)': [
                    'Adamdighi (আদমদীঘি)', 'Bogra Sadar (বগুড়া সদর)',
                    'Dhunat (ধুনট)', 'Dhupchanchia (দুপচাঁচিয়া)',
                    'Gabtali (গাবতলী)', 'Kahaloo (কাহালু)',
                    'Nandigram (নন্দীগ্রাম)', 'Sariakandi (সারিয়াকান্দি)',
                    'Shajahanpur (শাজাহানপুর)', 'Sherpur (শেরপুর)',
                    'Shibganj (শিবগঞ্জ)', 'Sonatala (সোনাতলা)'
                ],
                
                'Chapainawabganj (চাঁপাইনবাবগঞ্জ)': [
                    'Bholahat (ভোলাহাট)', 'Chapainawabganj Sadar (চাঁপাইনবাবগঞ্জ সদর)',
                    'Gomastapur (গোমস্তাপুর)', 'Nachole (নাচোল)',
                    'Shibganj (শিবগঞ্জ)'
                ],
                
                'Naogaon (নওগাঁ)': [
                    'Atrai (আত্রাই)', 'Badalgachhi (বদলগাছী)',
                    'Dhamoirhat (ধামইরহাট)', 'Manda (মান্দা)',
                    'Mahadebpur (মহাদেবপুর)', 'Naogaon Sadar (নওগাঁ সদর)',
                    'Niamatpur (নিয়ামতপুর)', 'Patnitala (পত্নীতলা)',
                    'Porsha (পোরশা)', 'Raninagar (রাণীনগর)', 'Sapahar (সাপাহার)'
                ],
                
                'Natore (নাটোর)': [
                    'Bagatipara (বাগাতিপাড়া)', 'Baraigram (বড়াইগ্রাম)',
                    'Gurudaspur (গুরুদাসপুর)', 'Lalpur (লালপুর)',
                    'Naldanga (নলডাঙ্গা)', 'Natore Sadar (নাটোর সদর)',
                    'Singra (সিংড়া)'
                ],
                
                'Pabna (পাবনা)': [
                    'Atgharia (আটঘরিয়া)', 'Bera (বেড়া)', 'Bhangura (ভাঙ্গুড়া)',
                    'Chatmohar (চাটমোহর)', 'Faridpur (ফরিদপুর)',
                    'Ishwardi (ঈশ্বরদী)', 'Pabna Sadar (পাবনা সদর)',
                    'Santhia (সাঁথিয়া)', 'Sujanagar (সুজানগর)'
                ],
                
                'Sirajganj (সিরাজগঞ্জ)': [
                    'Belkuchi (বেলকুচি)', 'Chauhali (চৌহালী)',
                    'Kamarkhanda (কামারখন্দ)', 'Kazipur (কাজীপুর)',
                    'Raiganj (রায়গঞ্জ)', 'Shahjadpur (শাহজাদপুর)',
                    'Sirajganj Sadar (সিরাজগঞ্জ সদর)', 'Tarash (তাড়াশ)',
                    'Ullahpara (উল্লাপাড়া)'
                ],
                
                'Joypurhat (জয়পুরহাট)': [
                    'Akkelpur (আক্কেলপুর)', 'Joypurhat Sadar (জয়পুরহাট সদর)',
                    'Kalai (কালাই)', 'Khetlal (ক্ষেতলাল)', 'Panchbibi (পাঁচবিবি)'
                ]
            },
            
            // ============================================================
            // 4. KHULNA DIVISION (খুলনা বিভাগ) — 10 Districts
            // ============================================================
            'Khulna (খুলনা)': {
                
                'Khulna (খুলনা)': [
                    'Batiaghata (বটিয়াঘাটা)', 'Dacope (দাকোপ)',
                    'Dighalia (দিঘলিয়া)', 'Dumuria (ডুমুরিয়া)',
                    'Khalishpur (খালিশপুর)', 'Khan Jahan Ali (খানজাহান আলী)',
                    'Khulna Sadar (খুলনা সদর)', 'Koyra (কয়রা)',
                    'Paikgachha (পাইকগাছা)', 'Phultala (ফুলতলা)',
                    'Rupsha (রূপসা)', 'Sonadanga (সোনাডাঙ্গা)',
                    'Terokhada (তেরখাদা)', 'Daulatpur (দৌলতপুর)',
                    'Harintana (হরিণটানা)'
                ],
                
                'Jessore (যশোর)': [
                    'Abhaynagar (অভয়নগর)', 'Bagherpara (বাঘারপাড়া)',
                    'Chaugachha (চৌগাছা)', 'Jhikargachha (ঝিকরগাছা)',
                    'Jessore Sadar (যশোর সদর)', 'Keshabpur (কেশবপুর)',
                    'Manirampur (মণিরামপুর)', 'Sharsha (শার্শা)'
                ],
                
                'Jhenaidah (ঝিনাইদহ)': [
                    'Harinakunda (হরিণাকুণ্ডু)', 'Jhenaidah Sadar (ঝিনাইদহ সদর)',
                    'Kaliganj (কালীগঞ্জ)', 'Kotchandpur (কোটচাঁদপুর)',
                    'Maheshpur (মহেশপুর)', 'Shailkupa (শৈলকুপা)'
                ],
                
                'Magura (মাগুরা)': [
                    'Magura Sadar (মাগুরা সদর)', 'Mohammadpur (মোহাম্মদপুর)',
                    'Shalikha (শালিখা)', 'Sreepur (শ্রীপুর)'
                ],
                
                'Narail (নড়াইল)': [
                    'Kalia (কালিয়া)', 'Lohagara (লোহাগাড়া)',
                    'Narail Sadar (নড়াইল সদর)'
                ],
                
                'Bagerhat (বাগেরহাট)': [
                    'Bagerhat Sadar (বাগেরহাট সদর)', 'Chitalmari (চিতলমারী)',
                    'Fakirhat (ফকিরহাট)', 'Kachua (কচুয়া)',
                    'Mollahat (মোল্লাহাট)', 'Mongla (মোংলা)',
                    'Morrelganj (মোড়েলগঞ্জ)', 'Rampal (রামপাল)',
                    'Sarankhola (শরণখোলা)'
                ],
                
                'Satkhira (সাতক্ষীরা)': [
                    'Assasuni (আশাশুনি)', 'Debhata (দেবহাটা)',
                    'Kalaroa (কলারোয়া)', 'Kaliganj (কালীগঞ্জ)',
                    'Satkhira Sadar (সাতক্ষীরা সদর)', 'Shyamnagar (শ্যামনগর)',
                    'Tala (তালা)'
                ],
                
                'Kushtia (কুষ্টিয়া)': [
                    'Bheramara (ভেড়ামারা)', 'Daulatpur (দৌলতপুর)',
                    'Khoksa (খোকসা)', 'Kumarkhali (কুমারখালী)',
                    'Kushtia Sadar (কুষ্টিয়া সদর)', 'Mirpur (মিরপুর)'
                ],
                
                'Chuadanga (চুয়াডাঙ্গা)': [
                    'Alamdanga (আলমডাঙ্গা)', 'Chuadanga Sadar (চুয়াডাঙ্গা সদর)',
                    'Damurhuda (দামুড়হুদা)', 'Jibannagar (জীবননগর)'
                ],
                
                'Meherpur (মেহেরপুর)': [
                    'Gangni (গাংনী)', 'Meherpur Sadar (মেহেরপুর সদর)',
                    'Mujibnagar (মুজিবনগর)'
                ]
            },
            
            // ============================================================
            // 5. SYLHET DIVISION (সিলেট বিভাগ) — 4 Districts
            // ============================================================
            'Sylhet (সিলেট)': {
                
                'Sylhet (সিলেট)': [
                    'Balaganj (বালাগঞ্জ)', 'Beanibazar (বিয়ানীবাজার)',
                    'Bishwanath (বিশ্বনাথ)', 'Companiganj (কোম্পানীগঞ্জ)',
                    'Dakshin Surma (দক্ষিণ সুরমা)', 'Fenchuganj (ফেঞ্চুগঞ্জ)',
                    'Golapganj (গোলাপগঞ্জ)', 'Gowainghat (গোয়াইনঘাট)',
                    'Jaintiapur (জৈন্তাপুর)', 'Kanaighat (কানাইঘাট)',
                    'Osmani Nagar (ওসমানীনগর)', 'Sylhet Sadar (সিলেট সদর)',
                    'Zakiganj (জকিগঞ্জ)', 'Jalalabad (জালালাবাদ)',
                    'Moglabazar (মোগলাবাজার)', 'Shahporan (শাহপরান)',
                    'Kotwali (কোতোয়ালি)', 'Airport (বিমানবন্দর)'
                ],
                
                'Moulvibazar (মৌলভীবাজার)': [
                    'Barlekha (বড়লেখা)', 'Juri (জুড়ী)',
                    'Kamalganj (কমলগঞ্জ)', 'Kulaura (কুলাউড়া)',
                    'Moulvibazar Sadar (মৌলভীবাজার সদর)', 'Rajnagar (রাজনগর)',
                    'Sreemangal (শ্রীমঙ্গল)'
                ],
                
                'Habiganj (হবিগঞ্জ)': [
                    'Ajmiriganj (অজমিরীগঞ্জ)', 'Bahubal (বাহুবল)',
                    'Baniachong (বানিয়াচং)', 'Chunarughat (চুনারুঘাট)',
                    'Habiganj Sadar (হবিগঞ্জ সদর)', 'Lakhai (লাখাই)',
                    'Madhabpur (মাধবপুর)', 'Nabiganj (নবীগঞ্জ)',
                    'Shaistagonj (শায়েস্তাগঞ্জ)'
                ],
                
                'Sunamganj (সুনামগঞ্জ)': [
                    'Bishwamvarpur (বিশ্বম্ভরপুর)', 'Chhatak (ছাতক)',
                    'Derai (দিরাই)', 'Dharampasha (ধর্মপাশা)',
                    'Dowarabazar (দোয়ারাবাজার)', 'Jagannathpur (জগন্নাথপুর)',
                    'Jamalganj (জামালগঞ্জ)', 'Sullah (সুল্লা)',
                    'Sunamganj Sadar (সুনামগঞ্জ সদর)', 'Tahirpur (তাহিরপুর)',
                    'Shantiganj (শান্তিগঞ্জ)', 'Madhyanagar (মধ্যনগর)'
                ]
            },
            
            // ============================================================
            // 6. BARISHAL DIVISION (বরিশাল বিভাগ) — 6 Districts
            // ============================================================
            'Barishal (বরিশাল)': {
                
                'Barishal (বরিশাল)': [
                    'Agailjhara (আগৈলঝাড়া)', 'Babuganj (বাবুগঞ্জ)',
                    'Bakerganj (বাকেরগঞ্জ)', 'Banaripara (বানারীপাড়া)',
                    'Barishal Sadar (বরিশাল সদর)', 'Gaurnadi (গৌরনদী)',
                    'Hizla (হিজলা)', 'Mehendiganj (মেহেন্দিগঞ্জ)',
                    'Muladi (মুলাদী)', 'Wazirpur (উজিরপুর)', 'Kotwali (কোতোয়ালি)',
                    'Kawnia (কাউনিয়া)', 'Airport (বিমানবন্দর)'
                ],
                
                'Patuakhali (পটুয়াখালী)': [
                    'Bauphal (বাউফল)', 'Dashmina (দশমিনা)',
                    'Dumki (দুমকি)', 'Galachipa (গলাচিপা)',
                    'Kalapara (কলাপাড়া)', 'Mirzaganj (মির্জাগঞ্জ)',
                    'Patuakhali Sadar (পটুয়াখালী সদর)', 'Rangabali (রাঙ্গাবালী)'
                ],
                
                'Barguna (বরগুনা)': [
                    'Amtali (আমতলী)', 'Bamna (বামনা)',
                    'Barguna Sadar (বরগুনা সদর)', 'Betagi (বেতাগী)',
                    'Patharghata (পাথরঘাটা)', 'Taltali (তালতলী)'
                ],
                
                'Jhalokathi (ঝালকাঠি)': [
                    'Jhalokathi Sadar (ঝালকাঠি সদর)', 'Kathalia (কাঠালিয়া)',
                    'Nalchity (নলছিটি)', 'Rajapur (রাজাপুর)'
                ],
                
                'Pirojpur (পিরোজপুর)': [
                    'Bhandaria (ভান্ডারিয়া)', 'Kawkhali (কাউখালী)',
                    'Mathbaria (মঠবাড়িয়া)', 'Nazirpur (নাজিরপুর)',
                    'Nesarabad (নেছারাবাদ)', 'Pirojpur Sadar (পিরোজপুর সদর)',
                    'Zianagar (জিয়ানগর)'
                ],
                
                'Bhola (ভোলা)': [
                    'Bhola Sadar (ভোলা সদর)', 'Borhanuddin (বোরহানউদ্দিন)',
                    'Char Fasson (চরফ্যাশন)', 'Daulatkhan (দৌলতখান)',
                    'Lalmohan (লালমোহন)', 'Manpura (মনপুরা)',
                    'Tazumuddin (তজুমুদ্দিন)'
                ]
            },
            
            // ============================================================
            // 7. RANGPUR DIVISION (রংপুর বিভাগ) — 8 Districts
            // ============================================================
            'Rangpur (রংপুর)': {
                
                'Rangpur (রংপুর)': [
                    'Badarganj (বদরগঞ্জ)', 'Gangachara (গঙ্গাচড়া)',
                    'Kaunia (কাউনিয়া)', 'Mithapukur (মিঠাপুকুর)',
                    'Pirgachha (পীরগাছা)', 'Pirganj (পীরগঞ্জ)',
                    'Rangpur Sadar (রংপুর সদর)', 'Taraganj (তারাগঞ্জ)'
                ],
                
                'Dinajpur (দিনাজপুর)': [
                    'Birampur (বিরামপুর)', 'Birganj (বীরগঞ্জ)',
                    'Biral (বিরল)', 'Bochaganj (বোচাগঞ্জ)',
                    'Chirirbandar (চিরিরবন্দর)', 'Dinajpur Sadar (দিনাজপুর সদর)',
                    'Fulbari (ফুলবাড়ী)', 'Ghoraghat (ঘোড়াঘাট)',
                    'Hakimpur (হাকিমপুর)', 'Kaharole (কাহারোল)',
                    'Khansama (খানসামা)', 'Nawabganj (নবাবগঞ্জ)',
                    'Parbatipur (পার্বতীপুর)'
                ],
                
                'Kurigram (কুড়িগ্রাম)': [
                    'Bhurungamari (ভুরুঙ্গামারী)', 'Char Rajibpur (চর রাজিবপুর)',
                    'Chilmari (চিলমারী)', 'Kurigram Sadar (কুড়িগ্রাম সদর)',
                    'Nageshwari (নাগেশ্বরী)', 'Phulbari (ফুলবাড়ী)',
                    'Rajarhat (রাজারহাট)', 'Raomari (রৌমারী)',
                    'Ulipur (উলিপুর)'
                ],
                
                'Gaibandha (গাইবান্ধা)': [
                    'Fulchhari (ফুলছড়ি)', 'Gaibandha Sadar (গাইবান্ধা সদর)',
                    'Gobindaganj (গোবিন্দগঞ্জ)', 'Palashbari (পলাশবাড়ী)',
                    'Sadullapur (সাদুল্লাপুর)', 'Saghata (সাঘাটা)',
                    'Sundarganj (সুন্দরগঞ্জ)'
                ],
                
                'Lalmonirhat (লালমনিরহাট)': [
                    'Aditmari (আদিতমারী)', 'Hatibandha (হাতীবান্ধা)',
                    'Kaliganj (কালীগঞ্জ)', 'Lalmonirhat Sadar (লালমনিরহাট সদর)',
                    'Patgram (পাটগ্রাম)'
                ],
                
                'Nilphamari (নীলফামারী)': [
                    'Dimla (ডিমলা)', 'Domar (ডোমার)',
                    'Jaldhaka (জলঢাকা)', 'Kishoreganj (কিশোরগঞ্জ)',
                    'Nilphamari Sadar (নীলফামারী সদর)', 'Saidpur (সৈয়দপুর)'
                ],
                
                'Panchagarh (পঞ্চগড়)': [
                    'Atwari (আটোয়ারী)', 'Boda (বোদা)',
                    'Debiganj (দেবীগঞ্জ)', 'Panchagarh Sadar (পঞ্চগড় সদর)',
                    'Tetulia (তেঁতুলিয়া)'
                ],
                
                'Thakurgaon (ঠাকুরগাঁও)': [
                    'Baliadangi (বালিয়াডাঙ্গী)', 'Haripur (হরিপুর)',
                    'Pirganj (পীরগঞ্জ)', 'Ranisankail (রাণীশংকৈল)',
                    'Thakurgaon Sadar (ঠাকুরগাঁও সদর)'
                ]
            },
            
            // ============================================================
            // 8. MYMENSINGH DIVISION (ময়মনসিংহ বিভাগ) — 4 Districts
            // ============================================================
            'Mymensingh (ময়মনসিংহ)': {
                
                'Mymensingh (ময়মনসিংহ)': [
                    'Bhaluka (ভালুকা)', 'Dhobaura (ধোবাউড়া)',
                    'Fulbaria (ফুলবাড়ীয়া)', 'Gafargaon (গফরগাঁও)',
                    'Gauripur (গৌরীপুর)', 'Haluaghat (হালুয়াঘাট)',
                    'Ishwarganj (ঈশ্বরগঞ্জ)', 'Muktagachha (মুক্তাগাছা)',
                    'Mymensingh Sadar (ময়মনসিংহ সদর)', 'Nandail (নান্দাইল)',
                    'Phulpur (ফুলপুর)', 'Tarakanda (তারাকান্দা)',
                    'Trishal (ত্রিশাল)'
                ],
                
                'Jamalpur (জামালপুর)': [
                    'Bakshiganj (বকশীগঞ্জ)', 'Dewanganj (দেওয়ানগঞ্জ)',
                    'Islampur (ইসলামপুর)', 'Jamalpur Sadar (জামালপুর সদর)',
                    'Madarganj (মাদারগঞ্জ)', 'Melandaha (মেলান্দহ)',
                    'Sarishabari (সরিষাবাড়ী)'
                ],
                
                'Netrokona (নেত্রকোনা)': [
                    'Atpara (আটপাড়া)', 'Barhatta (বারহাট্টা)',
                    'Durgapur (দুর্গাপুর)', 'Kalmakanda (কলমাকান্দা)',
                    'Kendua (কেন্দুয়া)', 'Khaliajuri (খালিয়াজুরী)',
                    'Madan (মদন)', 'Mohanganj (মোহনগঞ্জ)',
                    'Netrokona Sadar (নেত্রকোনা সদর)', 'Purbadhala (পূর্বধলা)'
                ],
                
                'Sherpur (শেরপুর)': [
                    'Jhenaigati (ঝিনাইগাতী)', 'Nakla (নকলা)',
                    'Nalitabari (নালিতাবাড়ী)', 'Sherpur Sadar (শেরপুর সদর)',
                    'Sreebardi (শ্রীবরদী)'
                ]
            }
        }
    }
};

window.DEFAULT_COUNTRY = 'bangladesh';
window.divisionData = window.LOCATION_DATA.bangladesh.levels;


console.log('✅ Location Data loaded');
