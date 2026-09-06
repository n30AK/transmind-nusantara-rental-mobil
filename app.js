/* =========================================================
   TRANSMIND NUSANTARA RENTAL MOBIL
   APP.JS — GO LIVE FINAL
   MODE: DATABASE + IMAGE_PATH + MAX 26 ARMADA
   ========================================================= */

'use strict';


console.log('==========================================');
console.log('TRANSMIND APP.JS GO-LIVE FINAL AKTIF');
console.log('MODE: DATABASE + IMAGE_PATH + 26 ARMADA');
console.log('==========================================');


/* =========================================================
   KONFIGURASI
   ========================================================= */

const WA_NUMBER = '6281292677888';

const VEHICLE_IMAGE_BUCKET = 'vehicle-images';

/*
   JUMLAH MAKSIMUM ARMADA YANG DITAMPILKAN
*/
const MAX_DISPLAY_VEHICLES = 26;


let sb = null;

let vehiclesCache = [];


/* =========================================================
   HELPER
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function escapeHtml(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =========================================================
   CEK KONFIGURASI SUPABASE
   ========================================================= */

function configured() {

    return Boolean(

        window.TRANSMIND_SUPABASE_URL &&

        window.TRANSMIND_SUPABASE_URL.startsWith('http') &&

        window.TRANSMIND_SUPABASE_ANON_KEY &&

        window.TRANSMIND_SUPABASE_ANON_KEY.length > 20

    );

}


/* =========================================================
   STATUS ARMADA
   ========================================================= */

function setFleetStatus(message, type = 'normal') {

    const status = getElement('fleetStatus');


    if (!status) {

        return;

    }


    status.textContent = message;

    status.dataset.status = type;


    console.log(
        'FLEET STATUS:',
        message
    );

}


/* =========================================================
   URL GAMBAR DARI SUPABASE STORAGE
   ========================================================= */

function getVehicleImageUrl(vehicle) {

    if (!sb) {

        return '';

    }


    const imagePath = String(
        vehicle?.image_path || ''
    ).trim();


    if (!imagePath) {

        console.warn(
            'IMAGE_PATH KOSONG:',
            vehicle?.name
        );

        return '';

    }


    try {

        const {
            data
        } = sb.storage
            .from(VEHICLE_IMAGE_BUCKET)
            .getPublicUrl(imagePath);


        const url =
            data?.publicUrl || '';


        console.log(
            'IMAGE:',
            vehicle.name,
            '=>',
            imagePath
        );


        return url;


    } catch (error) {

        console.error(
            'GAGAL MEMBUAT URL GAMBAR:',
            vehicle?.name,
            error
        );


        return '';

    }

}


/* =========================================================
   HANDLE GAMBAR ERROR
   ========================================================= */

function handleVehicleImageError(img) {

    if (!img) {

        return;

    }


    console.warn(
        'GAMBAR GAGAL DIMUAT:',
        img.src
    );


    img.style.display = 'none';


    const placeholder =
        img.parentElement
            ?.querySelector(
                '.vehicle-placeholder'
            );


    if (placeholder) {

        placeholder.style.display =
            'flex';

    }

}


/* =========================================================
   FILTER ARMADA

   ATURAN:
   - HARUS MEMILIKI IMAGE_PATH
   - ACTIVE TIDAK MENJADI FILTER
   - MAKSIMAL 26 UNIT
   ========================================================= */

function filterValidVehicles(list) {

    if (!Array.isArray(list)) {

        return [];

    }


    const vehiclesWithImage =
        list.filter(vehicle => {

            const imagePath =
                String(
                    vehicle.image_path || ''
                ).trim();


            return Boolean(imagePath);

        });


    console.log(
        'TOTAL ARMADA DENGAN GAMBAR:',
        vehiclesWithImage.length
    );


    return vehiclesWithImage
        .slice(
            0,
            MAX_DISPLAY_VEHICLES
        );

}


/* =========================================================
   RENDER ARMADA
   ========================================================= */

function showCars(list) {


    vehiclesCache =
        filterValidVehicles(list);


    console.log(
        'ARMADA VALID UNTUK DITAMPILKAN:',
        vehiclesCache.length,
        vehiclesCache
    );


    const vehicleSelect =
        getElement('vehicle');


    const cars =
        getElement('cars');


    /* =====================================================
       DROPDOWN BOOKING
       ===================================================== */

    if (vehicleSelect) {

        vehicleSelect.innerHTML =
            '<option value="">Pilih kendaraan</option>';


        vehiclesCache.forEach(vehicle => {

            const option =
                document.createElement('option');


            option.value =
                vehicle.id || '';


            option.textContent =
                vehicle.name || 'Kendaraan';


            vehicleSelect.appendChild(option);

        });

    }


    /* =====================================================
       CONTAINER ARMADA
       ===================================================== */

    if (!cars) {

        console.error(
            'ELEMENT #cars TIDAK DITEMUKAN'
        );

        return;

    }


    /* =====================================================
       TIDAK ADA ARMADA
       ===================================================== */

    if (!vehiclesCache.length) {

        cars.innerHTML = `

            <div class="fleet-empty">

                <strong>
                    Armada belum tersedia.
                </strong>

                <br>

                Silakan hubungi
                Transmind Nusantara.

            </div>

        `;


        return;

    }


    /* =====================================================
       BUAT KARTU ARMADA
       ===================================================== */

    cars.innerHTML =
        vehiclesCache.map(vehicle => {


            const name =
                vehicle.name ||
                'Kendaraan';


            /*
               JENIS KENDARAAN
            */

            const category =
                vehicle.category ||
                'Armada Transmind';


            /*
               KAPASITAS
            */

            const capacity =
                vehicle.capacity ||
                'Kapasitas sesuai tipe kendaraan';


            const id =
                vehicle.id ||
                '';


            const imageUrl =
                getVehicleImageUrl(vehicle);


            return `

                <article
                    class="car"
                    data-vehicle-id="${escapeHtml(id)}"
                >

                    <!-- FOTO -->

                    <div class="photo">


                        ${

                            imageUrl

                                ?

                                `

                                <img

                                    src="${escapeHtml(imageUrl)}"

                                    alt="${escapeHtml(name)}"

                                    loading="lazy"

                                    onerror="
                                        handleVehicleImageError(this);
                                    "

                                >

                                `

                                :

                                ''

                        }


                        <!-- PLACEHOLDER -->

                        <div
                            class="vehicle-placeholder"

                            style="
                                display:${imageUrl ? 'none' : 'flex'};
                                width:100%;
                                height:220px;
                                align-items:center;
                                justify-content:center;
                                text-align:center;
                                padding:20px;
                            "
                        >

                            <strong>

                                ${escapeHtml(name)}

                            </strong>

                        </div>


                    </div>


                    <!-- INFORMASI ARMADA -->

                    <div class="ci">


                        <!-- NAMA KENDARAAN -->

                        <h3
                            style="
                                margin:0 0 8px;
                                color:#ffffff;
                                font-size:17px;
                                line-height:1.35;
                            "
                        >

                            ${escapeHtml(name)}

                        </h3>


                        <!-- JENIS KENDARAAN DI BAWAH GAMBAR -->

                        <b>

                            JENIS:
                            ${escapeHtml(category)}

                        </b>


                        <!-- KAPASITAS -->

                        <p>

                            ${escapeHtml(capacity)}

                            &nbsp;•&nbsp;

                            Jabodetabek

                        </p>


                        <!-- TOMBOL PILIH -->

                        <button
                            type="button"

                            class="btn gold"

                            data-select-vehicle="${escapeHtml(id)}"
                        >

                            PILIH KENDARAAN

                        </button>


                    </div>


                </article>

            `;


        }).join('');


    /* =====================================================
       EVENT TOMBOL PILIH
       ===================================================== */

    cars
        .querySelectorAll(
            '[data-select-vehicle]'
        )
        .forEach(button => {


            button.addEventListener(
                'click',
                () => {


                    selectVehicle(
                        button.dataset.selectVehicle
                    );


                }
            );


        });

}


/* =========================================================
   PILIH KENDARAAN
   ========================================================= */

function selectVehicle(vehicleId) {


    const select =
        getElement('vehicle');


    if (!select) {

        console.error(
            'SELECT #vehicle TIDAK DITEMUKAN'
        );

        return;

    }


    select.value =
        vehicleId || '';


    if (
        select.value !== vehicleId
    ) {

        console.warn(
            'VEHICLE ID TIDAK DITEMUKAN:',
            vehicleId
        );

        return;

    }


    updateVehicleInfo(vehicleId);


    window.location.hash =
        'booking';


    setTimeout(() => {

        select.focus();

    }, 300);

}


/* =========================================================
   INFORMASI KENDARAAN
   ========================================================= */

function updateVehicleInfo(vehicleId) {


    const priceBox =
        getElement('vehiclePrice');


    if (!priceBox) {

        return;

    }


    if (!vehicleId) {

        priceBox.textContent =
            'Pilih kendaraan untuk melihat informasi kendaraan.';

        return;

    }


    const vehicle =
        vehiclesCache.find(
            item =>
                String(item.id) ===
                String(vehicleId)
        );


    if (!vehicle) {

        priceBox.textContent =
            'Kendaraan tidak ditemukan.';

        return;

    }


    priceBox.textContent =
        `${vehicle.name} • ${

            vehicle.category ||
            'Armada'

        } • ${

            vehicle.capacity ||
            'Kapasitas sesuai tipe kendaraan'

        }`;

}


/* =========================================================
   LOAD ARMADA DARI DATABASE
   ========================================================= */

async function loadVehicles() {


    setFleetStatus(
        'Memuat armada...',
        'loading'
    );


    /* =====================================================
       CEK KONFIGURASI
       ===================================================== */

    if (!configured()) {

        console.error(
            'SUPABASE BELUM DIKONFIGURASI'
        );


        setFleetStatus(
            'Konfigurasi database belum tersedia.',
            'error'
        );


        return;

    }


    /* =====================================================
       CEK SUPABASE LIBRARY
       ===================================================== */

    if (

        !window.supabase ||

        typeof window.supabase.createClient !==
        'function'

    ) {

        console.error(
            'SUPABASE LIBRARY TIDAK TERMUAT'
        );


        setFleetStatus(
            'Library Supabase gagal dimuat.',
            'error'
        );


        return;

    }


    try {


        /* =================================================
           BUAT CLIENT
           ================================================= */

        sb =
            window.supabase.createClient(

                window.TRANSMIND_SUPABASE_URL,

                window.TRANSMIND_SUPABASE_ANON_KEY

            );


        console.log(
            'SUPABASE CLIENT BERHASIL DIBUAT'
        );


        /* =================================================
           AMBIL ARMADA

           PENTING:
           TIDAK ADA FILTER active = true

           KITA AMBIL SEMUA KENDARAAN
           YANG MEMILIKI IMAGE_PATH
           ================================================= */

        const {

            data,

            error

        } = await sb

            .from('vehicles')

            .select(`

                id,
                name,
                slug,
                category,
                capacity,
                active,
                sort_order,
                image_path

            `)

            .not(
                'image_path',
                'is',
                null
            )

            .order(
                'sort_order',
                {
                    ascending: true
                }
            )

            .order(
                'name',
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                'GAGAL MENGAMBIL ARMADA:',
                error
            );


            throw error;

        }


        console.log(
            'DATA DATABASE DITERIMA:',
            data?.length || 0,
            data
        );


        /* =================================================
           FILTER ARMADA
           ================================================= */

        const validVehicles =
            filterValidVehicles(data);


        console.log(
            'TOTAL ARMADA SIAP DITAMPILKAN:',
            validVehicles.length
        );


        console.log(
            'DAFTAR ARMADA:',
            validVehicles.map(vehicle => ({

                name: vehicle.name,

                category: vehicle.category,

                active: vehicle.active,

                image_path: vehicle.image_path

            }))
        );


        /* =================================================
           RENDER
           ================================================= */

        showCars(validVehicles);


        /* =================================================
           STATUS
           ================================================= */

        if (!validVehicles.length) {

            setFleetStatus(
                'Belum ada armada yang memiliki gambar.',
                'warning'
            );


            return;

        }


        setFleetStatus(

            `${validVehicles.length} armada tersedia`,

            'success'

        );


    } catch (error) {


        console.error(
            'LOAD VEHICLES ERROR:',
            error
        );


        setFleetStatus(
            'Gagal memuat armada dari database.',
            'error'
        );


        const cars =
            getElement('cars');


        if (cars) {

            cars.innerHTML = `

                <div class="fleet-empty">

                    <strong>
                        Armada sedang tidak dapat dimuat.
                    </strong>

                    <br>

                    Silakan refresh halaman.

                </div>

            `;

        }

    }

}


/* =========================================================
   DATA FORM
   ========================================================= */

function getFormData() {


    const vehicleSelect =
        getElement('vehicle');


    const selectedOption =

        vehicleSelect &&

        vehicleSelect.options[
            vehicleSelect.selectedIndex
        ];


    return {


        name:

            getElement('name')
                ?.value
                .trim() || '',


        phone:

            getElement('phone')
                ?.value
                .trim() || '',


        vehicleId:

            vehicleSelect
                ?.value
                .trim() || '',


        vehicleName:

            selectedOption
                ?.textContent
                .trim() || '',


        service:

            getElement('service')
                ?.value
                .trim() || '',


        start:

            getElement('start')
                ?.value || '',


        end:

            getElement('end')
                ?.value || '',


        area:

            getElement('area')
                ?.value
                .trim() || '',


        notes:

            getElement('notes')
                ?.value
                .trim() || ''

    };

}


/* =========================================================
   VALIDASI BOOKING
   ========================================================= */

function validateBooking(
    data,
    resultBox
) {


    if (!data.vehicleId) {

        resultBox.textContent =
            'Silakan pilih kendaraan terlebih dahulu.';

        return false;

    }


    if (!data.name) {

        resultBox.textContent =
            'Nama wajib diisi.';

        return false;

    }


    if (!data.phone) {

        resultBox.textContent =
            'Nomor WhatsApp wajib diisi.';

        return false;

    }


    if (!data.service) {

        resultBox.textContent =
            'Silakan pilih layanan.';

        return false;

    }


    if (
        !data.start ||
        !data.end
    ) {

        resultBox.textContent =
            'Tanggal booking wajib diisi.';

        return false;

    }


    if (
        data.end < data.start
    ) {

        resultBox.textContent =
            'Tanggal selesai tidak boleh sebelum tanggal mulai.';

        return false;

    }


    return true;

}


/* =========================================================
   WHATSAPP BOOKING BERHASIL
   ========================================================= */

function openSuccessWhatsApp(
    formData,
    result
) {


    if (Array.isArray(result)) {

        result = result[0];

    }


    const code =
        result?.booking_code ||
        'TRM-BOOKING';


    const vehicleName =
        result?.vehicle_name ||
        formData?.vehicleName ||
        '-';


    const message = `Halo Transmind Nusantara,

Booking saya sudah dibuat.

Kode Booking: ${code}

Nama: ${formData?.name || '-'}
WhatsApp: ${formData?.phone || '-'}

Kendaraan: ${vehicleName}
Layanan: ${formData?.service || '-'}

Tanggal:
${formData?.start || '-'} s/d ${formData?.end || '-'}

Area: ${formData?.area || '-'}
Catatan: ${formData?.notes || '-'}

Mohon konfirmasi booking saya.

Terima kasih.`;


    const url =

        'https://wa.me/' +

        WA_NUMBER +

        '?text=' +

        encodeURIComponent(message);


    console.log(
        'MEMBUKA WHATSAPP BOOKING:',
        url
    );


    window.location.href =
        url;

}


/* =========================================================
   WHATSAPP KENDARAAN TIDAK TERSEDIA
   ========================================================= */

function openUnavailableWhatsApp(
    formData,
    messageText
) {


    const message = `Halo Transmind Nusantara.

Saya ingin menyewa kendaraan, tetapi kendaraan yang saya pilih sedang tidak tersedia.

Kendaraan: ${formData.vehicleName || '-'}
Layanan: ${formData.service || '-'}

Tanggal:
${formData.start || '-'} s/d ${formData.end || '-'}

Area:
${formData.area || '-'}

Keterangan sistem:
${messageText || '-'}

Mohon dibantu mencarikan kendaraan alternatif.

Terima kasih.`;


    const url =

        'https://wa.me/' +

        WA_NUMBER +

        '?text=' +

        encodeURIComponent(message);


    window.location.href =
        url;

}


/* =========================================================
   KIRIM EMAIL BOOKING
   TAMBAHAN - TIDAK MENGUBAH SISTEM BOOKING
   ========================================================= */

async function sendBookingEmail(
    formData,
    result
) {

    try {

        /* =================================================
           CEK SUPABASE CLIENT
           ================================================= */

        if (!sb) {

            console.warn(
                'EMAIL BOOKING: Supabase client belum tersedia.'
            );

            return;

        }


        /* =================================================
           NORMALISASI HASIL RPC
           Mendukung beberapa kemungkinan nama field
           ================================================= */

        const bookingCode =

            result?.booking_code ||

            result?.bookingCode ||

            '';


        const vehicleName =

            result?.vehicle_name ||

            result?.vehicleName ||

            formData?.vehicleName ||

            '';


        const unitCode =

            result?.unit_code ||

            result?.unitCode ||

            '';


        const sourceType =

            result?.source_type ||

            result?.sourceType ||

            '';


        const allocationStatus =

            result?.allocation_status ||

            result?.allocationStatus ||

            result?.status ||

            'CONFIRMED';


        const start =

            result?.start_date ||

            result?.start_at ||

            result?.startDate ||

            result?.start ||

            formData?.start ||

            '';


        const end =

            result?.end_date ||

            result?.end_at ||

            result?.endDate ||

            result?.end ||

            formData?.end ||

            '';


        const totalDays =

            Number(

                result?.total_days ??

                result?.totalDays ??

                0

            );


        const dailyPrice =

            Number(

                result?.daily_price ??

                result?.dailyPrice ??

                0

            );


        const totalPrice =

            Number(

                result?.total_price ??

                result?.totalPrice ??

                0

            );


        /* =================================================
           PAYLOAD
           HARUS SESUAI EDGE FUNCTION
           ================================================= */

        const payload = {

            bookingCode:
                bookingCode,

            name:
                formData?.name || '',

            phone:
                formData?.phone || '',

            vehicleName:
                vehicleName,

            service:
                formData?.service || '',

            start:
                start,

            end:
                end,

            area:
                formData?.area || '',

            notes:
                formData?.notes || '',

            totalDays:
                totalDays,

            dailyPrice:
                dailyPrice,

            totalPrice:
                totalPrice,

            allocationStatus:
                allocationStatus,

            unitCode:
                unitCode,

            sourceType:
                sourceType

        };


        /* =================================================
           VALIDASI BOOKING CODE
           ================================================= */

        if (!payload.bookingCode) {

            console.error(
                'EMAIL BOOKING DIBATALKAN: bookingCode kosong.',
                result
            );

            return;

        }


        console.log(
            'MENGIRIM NOTIFIKASI EMAIL:',
            payload
        );


        /* =================================================
           PANGGIL EDGE FUNCTION
           ================================================= */

        const {
            data,
            error
        } = await sb.functions.invoke(

            'send-booking-email',

            {
                body: payload
            }

        );


        /* =================================================
           HANDLE ERROR
           ================================================= */

        if (error) {

            console.error(
                'EMAIL BOOKING GAGAL:',
                error
            );

            return;

        }


        /* =================================================
           BERHASIL
           ================================================= */

        console.log(
            'EMAIL BOOKING BERHASIL DIKIRIM:',
            data
        );


    } catch (error) {

        console.error(
            'SEND BOOKING EMAIL ERROR:',
            error
        );

    }

}


/* =========================================================
   SUBMIT BOOKING
   ========================================================= */

async function submitBooking(event) {


    event.preventDefault();


    const form =
        event.currentTarget;


    const resultBox =
        getElement('result');


    if (!resultBox) {

        return;

    }


    const data =
        getFormData();


    /* =====================================================
       VALIDASI
       ===================================================== */

    if (

        !validateBooking(
            data,
            resultBox
        )

    ) {

        return;

    }


    /* =====================================================
       CEK DATABASE
       ===================================================== */

    if (!sb) {

        resultBox.textContent =
            'Database belum terhubung. Silakan refresh halaman.';

        return;

    }


    resultBox.textContent =
        'Memproses booking...';


    try {


        console.log(
            'MENGIRIM BOOKING:',
            data
        );


        /* =================================================
           RPC CREATE BOOKING
           ================================================= */

        const {

            data: rpcData,

            error

        } = await sb.rpc(

            'create_booking',

            {

                p_name:
                    data.name,

                p_phone:
                    data.phone,

                p_vehicle_id:
                    data.vehicleId,

                p_service:
                    data.service,

                p_start_date:
                    data.start,

                p_end_date:
                    data.end,

                p_area:
                    data.area,

                p_notes:
                    data.notes

            }

        );


        console.log(
            'CREATE BOOKING RESULT:',
            rpcData
        );


        if (error) {

            console.error(
                'CREATE BOOKING ERROR:',
                error
            );


            resultBox.textContent =
                'Terjadi kesalahan sistem: ' +
                error.message;


            return;

        }


        const result =

            Array.isArray(rpcData)

                ? rpcData[0]

                : rpcData;


        if (!result) {

            resultBox.textContent =
                'Database tidak mengembalikan hasil booking.';

            return;

        }


        /* =================================================
           BOOKING GAGAL
           ================================================= */

        if (!result.success) {


            const message =

                result.message ||

                'Booking tidak dapat dibuat.';


            resultBox.innerHTML =

                `<b>${escapeHtml(message)}</b>`;


            if (

                /tidak tersedia|sedang digunakan|seluruh unit/i
                    .test(message)

            ) {

                openUnavailableWhatsApp(
                    data,
                    message
                );

            }


            return;

        }


        /* =================================================
           BOOKING BERHASIL
           ================================================= */

        resultBox.innerHTML = `

            <b>
                Booking berhasil dibuat.
            </b>

            <br><br>

            Kode Booking:

            <b>
                ${escapeHtml(
                    result.booking_code || '-'
                )}
            </b>

            <br><br>

            Kendaraan:

            <b>
                ${escapeHtml(
                    result.vehicle_name ||
                    data.vehicleName
                )}
            </b>

        `;


        /* =================================================
           EMAIL NOTIFICATION
           ================================================= */

        sendBookingEmail(
            data,
            result
        );


        /* =================================================
           WHATSAPP
           ================================================= */

        setTimeout(() => {

            openSuccessWhatsApp(
                data,
                result
            );

        }, 800);


        /* =================================================
           RESET FORM
           ================================================= */

        setTimeout(() => {


            form.reset();


            const vehicleSelect =
                getElement('vehicle');


            if (vehicleSelect) {

                vehicleSelect.selectedIndex = 0;

            }


            updateVehicleInfo('');


        }, 1500);


    } catch (error) {


        console.error(
            'SUBMIT BOOKING ERROR:',
            error
        );


        resultBox.textContent =

            'Terjadi kesalahan: ' +

            (
                error?.message ||
                'Unknown error'
            );

    }

}


/* =========================================================
   SETUP EVENT
   ========================================================= */

function setupEvents() {


    /* =====================================================
       FORM BOOKING
       ===================================================== */

    const form =
        getElement('bookingForm');


    if (form) {

        form.addEventListener(
            'submit',
            submitBooking
        );

    }


    /* =====================================================
       DROPDOWN KENDARAAN
       ===================================================== */

    const vehicle =
        getElement('vehicle');


    if (vehicle) {

        vehicle.addEventListener(
            'change',
            event => {

                updateVehicleInfo(
                    event.target.value
                );

            }
        );

    }


    /* =====================================================
       TANGGAL
       ===================================================== */

    const start =
        getElement('start');


    const end =
        getElement('end');


    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    if (start) {

        start.min =
            today;

    }


    if (end) {

        end.min =
            today;

    }


    if (
        start &&
        end
    ) {

        start.addEventListener(
            'change',
            () => {


                end.min =
                    start.value;


                if (

                    end.value &&

                    end.value < start.value

                ) {

                    end.value =
                        start.value;

                }

            }
        );

    }

}


/* =========================================================
   INIT
   ========================================================= */

async function init() {


    console.log(
        '=========================================='
    );


    console.log(
        'TRANSMIND INITIALIZATION DIMULAI'
    );


    console.log(
        '=========================================='
    );


    setupEvents();


    await loadVehicles();


    console.log(
        '=========================================='
    );


    console.log(
        'TRANSMIND INITIALIZATION SELESAI'
    );


    console.log(
        '=========================================='
    );

}


/* =========================================================
   GLOBAL FUNCTION
   PENTING UNTUK ONERROR HTML
   ========================================================= */

window.handleVehicleImageError =
    handleVehicleImageError;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    init
);
