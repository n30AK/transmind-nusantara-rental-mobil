/* =========================================================
   TRANSMIND NUSANTARA RENTAL MOBIL
   APP.JS — GO LIVE FINAL
   MODE:
   DATABASE + IMAGE_PATH + MAX 26 ARMADA
   BOOKING + WHATSAPP + EMAIL OTOMATIS
   ========================================================= */

'use strict';

console.log('==========================================');
console.log('TRANSMIND APP.JS GO-LIVE FINAL AKTIF');
console.log('MODE: DATABASE + IMAGE_PATH + 26 ARMADA');
console.log('EMAIL: OTOMATIS SETELAH BOOKING');
console.log('==========================================');


/* =========================================================
   CONFIG
   ========================================================= */

const WA_NUMBER = '6281292677888';

const VEHICLE_IMAGE_BUCKET = 'vehicle-images';

const MAX_DISPLAY_VEHICLES = 26;

let sb = null;

let vehiclesCache = [];


/* =========================================================
   HELPER
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

function configured() {

    const url =
        window.TRANSMIND_SUPABASE_URL;

    const key =
        window.TRANSMIND_SUPABASE_ANON_KEY;


    if (!url) {

        console.error(
            'TRANSMIND_SUPABASE_URL tidak ditemukan.'
        );

        return false;
    }


    if (!key) {

        console.error(
            'TRANSMIND_SUPABASE_ANON_KEY tidak ditemukan.'
        );

        return false;
    }


    return true;
}


/* =========================================================
   FLEET STATUS
   ========================================================= */

function setFleetStatus(message) {

    const status =
        getElement('fleetStatus');

    if (status) {
        status.textContent =
            message || '';
    }
}


/* =========================================================
   VEHICLE IMAGE URL
   ========================================================= */

function getVehicleImageUrl(vehicle) {

    if (!vehicle) {
        return '';
    }


    const imagePath =
        vehicle.image_path;


    if (!imagePath) {
        return '';
    }


    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
    ) {

        return imagePath;
    }


    if (!sb) {
        return '';
    }


    try {

        const result =
            sb.storage
                .from(VEHICLE_IMAGE_BUCKET)
                .getPublicUrl(
                    imagePath
                );


        return (
            result?.data?.publicUrl ||
            ''
        );

    } catch (error) {

        console.error(
            'GAGAL MEMBUAT URL GAMBAR:',
            error
        );

        return '';
    }
}


/* =========================================================
   IMAGE ERROR
   ========================================================= */

function handleVehicleImageError(img) {

    if (!img) {
        return;
    }


    console.warn(
        'Gambar armada gagal dimuat:',
        img.getAttribute('src')
    );


    img.onerror = null;


    img.src =
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="800"
                 height="500"
                 viewBox="0 0 800 500">

                <rect
                    width="800"
                    height="500"
                    fill="#111"
                />

                <text
                    x="400"
                    y="245"
                    text-anchor="middle"
                    fill="#c9a227"
                    font-size="30"
                    font-family="Arial"
                >
                    TRANSMIND
                </text>

                <text
                    x="400"
                    y="285"
                    text-anchor="middle"
                    fill="#fff"
                    font-size="18"
                    font-family="Arial"
                >
                    Armada
                </text>

            </svg>
        `);
}


/* =========================================================
   FILTER VEHICLES
   ========================================================= */

function filterValidVehicles(vehicles) {

    if (!Array.isArray(vehicles)) {
        return [];
    }


    return vehicles.filter(
        function(vehicle) {

            return (
                vehicle &&
                vehicle.id &&
                vehicle.name
            );

        }
    );
}


/* =========================================================
   SHOW CARS
   ========================================================= */

function showCars(vehicles) {

    const carsContainer =
        getElement('cars');


    if (!carsContainer) {

        console.error(
            'ELEMENT #cars TIDAK DITEMUKAN.'
        );

        return;
    }


    carsContainer.innerHTML = '';


    if (
        !Array.isArray(vehicles) ||
        vehicles.length === 0
    ) {

        carsContainer.innerHTML = `
            <div class="fleet-empty">
                Armada belum tersedia.
            </div>
        `;

        setFleetStatus(
            'Armada belum tersedia.'
        );

        return;
    }


    console.log(
        'SHOW CARS:',
        vehicles.length,
        'unit'
    );


    vehicles.forEach(
        function(vehicle) {

            const imageUrl =
                getVehicleImageUrl(
                    vehicle
                );


            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'car-card';


            const image =
                document.createElement(
                    'img'
                );


            image.className =
                'car-image';


            image.alt =
                vehicle.name ||
                'Armada Transmind';


            image.loading =
                'lazy';


            if (imageUrl) {

                image.src =
                    imageUrl;

            } else {

                image.src =
                    'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg"
                             width="800"
                             height="500"
                             viewBox="0 0 800 500">

                            <rect
                                width="800"
                                height="500"
                                fill="#111"
                            />

                            <text
                                x="400"
                                y="245"
                                text-anchor="middle"
                                fill="#c9a227"
                                font-size="30"
                                font-family="Arial"
                            >
                                TRANSMIND
                            </text>

                            <text
                                x="400"
                                y="285"
                                text-anchor="middle"
                                fill="#fff"
                                font-size="18"
                                font-family="Arial"
                            >
                                ${escapeHtml(
                                    vehicle.name
                                )}
                            </text>

                        </svg>
                    `);
            }


            image.onerror =
                function() {

                    handleVehicleImageError(
                        this
                    );

                };


            const content =
                document.createElement(
                    'div'
                );


            content.className =
                'car-content';


            const title =
                document.createElement(
                    'h3'
                );


            title.textContent =
                vehicle.name;


            content.appendChild(
                title
            );


            if (vehicle.category) {

                const category =
                    document.createElement(
                        'p'
                    );


                category.className =
                    'car-category';


                category.textContent =
                    vehicle.category;


                content.appendChild(
                    category
                );
            }


            if (vehicle.capacity) {

                const capacity =
                    document.createElement(
                        'p'
                    );


                capacity.className =
                    'car-capacity';


                capacity.textContent =
                    'Kapasitas: ' +
                    vehicle.capacity +
                    ' orang';


                content.appendChild(
                    capacity
                );
            }


            const button =
                document.createElement(
                    'button'
                );


            button.type =
                'button';


            button.className =
                'btn gold';


            button.textContent =
                'PILIH ARMADA';


            button.addEventListener(
                'click',
                function() {

                    selectVehicle(
                        vehicle.id
                    );

                }
            );


            content.appendChild(
                button
            );


            card.appendChild(
                image
            );


            card.appendChild(
                content
            );


            carsContainer.appendChild(
                card
            );

        }
    );


    setFleetStatus(
        'Menampilkan ' +
        vehicles.length +
        ' unit armada.'
    );
}


/* =========================================================
   LOAD VEHICLES
   ========================================================= */

async function loadVehicles() {

    console.log(
        'LOAD VEHICLES: mulai...'
    );


    setFleetStatus(
        'Memuat armada...'
    );


    if (!sb) {

        console.error(
            'LOAD VEHICLES: Supabase belum siap.'
        );

        setFleetStatus(
            'Koneksi database belum siap.'
        );

        return;
    }


    try {

        /*
         * Query dibuat sederhana.
         *
         * Tidak menggunakan sort_order.
         * Tidak membatasi active.
         *
         * Ini untuk memastikan armada
         * kembali muncul terlebih dahulu.
         */

        const response =
            await sb
                .from('vehicles')
                .select(
                    'id, name, slug, category, capacity, active, image_path'
                )
                .order(
                    'name',
                    {
                        ascending: true
                    }
                );


        const data =
            response?.data;


        const error =
            response?.error;


        if (error) {

            console.error(
                'GAGAL MEMUAT ARMADA:',
                error
            );


            setFleetStatus(
                'Armada gagal dimuat.'
            );


            return;
        }


        console.log(
            'ARMADA DATABASE:',
            data
        );


        if (!Array.isArray(data)) {

            console.error(
                'DATA ARMADA BUKAN ARRAY:',
                data
            );


            setFleetStatus(
                'Data armada tidak valid.'
            );


            return;
        }


        vehiclesCache =
            data;


        const validVehicles =
            filterValidVehicles(
                data
            );


        console.log(
            'ARMADA VALID:',
            validVehicles.length
        );


        /*
         * Tampilkan maksimal 26 armada.
         */

        const vehiclesToDisplay =
            validVehicles
                .slice(
                    0,
                    MAX_DISPLAY_VEHICLES
                );


        console.log(
            'ARMADA DITAMPILKAN:',
            vehiclesToDisplay.length
        );


        showCars(
            vehiclesToDisplay
        );


        populateVehicleSelect(
            vehiclesToDisplay
        );


    } catch (error) {

        console.error(
            'ERROR LOAD VEHICLES:',
            error
        );


        setFleetStatus(
            'Terjadi kesalahan saat memuat armada.'
        );
    }
}


/* =========================================================
   POPULATE VEHICLE SELECT
   ========================================================= */

function populateVehicleSelect(
    vehicles
) {

    const select =
        getElement('vehicle');


    if (!select) {

        console.warn(
            'ELEMENT #vehicle TIDAK DITEMUKAN.'
        );

        return;
    }


    const currentValue =
        select.value;


    select.innerHTML = `
        <option value="">
            Pilih kendaraan
        </option>
    `;


    if (!Array.isArray(vehicles)) {
        return;
    }


    vehicles.forEach(
        function(vehicle) {

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                vehicle.id;


            option.textContent =
                vehicle.name;


            option.dataset.vehicleName =
                vehicle.name || '';


            option.dataset.category =
                vehicle.category || '';


            option.dataset.capacity =
                vehicle.capacity || '';


            select.appendChild(
                option
            );

        }
    );


    if (currentValue) {

        const exists =
            Array.from(
                select.options
            ).some(
                function(option) {

                    return (
                        option.value ===
                        currentValue
                    );

                }
            );


        if (exists) {

            select.value =
                currentValue;

        }
    }


    updateVehicleInfo();
}


/* =========================================================
   SELECT VEHICLE
   ========================================================= */

function selectVehicle(
    vehicleId
) {

    const select =
        getElement('vehicle');


    if (!select) {
        return;
    }


    select.value =
        vehicleId;


    updateVehicleInfo();


    const bookingForm =
        getElement(
            'bookingForm'
        );


    if (bookingForm) {

        bookingForm.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

    }
}


/* =========================================================
   UPDATE VEHICLE INFO
   ========================================================= */

function updateVehicleInfo() {

    const select =
        getElement('vehicle');


    if (!select) {
        return;
    }


    const selectedOption =
        select.options[
            select.selectedIndex
        ];


    if (!selectedOption) {
        return;
    }


    const vehicleId =
        selectedOption.value;


    const vehicle =
        vehiclesCache.find(
            function(item) {

                return (
                    String(item.id) ===
                    String(vehicleId)
                );

            }
        );


    window.selectedVehicle =
        vehicle || null;


    console.log(
        'VEHICLE SELECTED:',
        vehicle
    );
}


/* =========================================================
   GET FORM DATA
   ========================================================= */

function getFormData() {

    return {

        name:
            getElement(
                'name'
            )?.value?.trim() || '',


        phone:
            getElement(
                'phone'
            )?.value?.trim() || '',


        vehicleId:
            getElement(
                'vehicle'
            )?.value || '',


        vehicleName:
            getElement(
                'vehicle'
            )
            ?.selectedOptions?.[0]
            ?.textContent
            ?.trim() || '',


        vehiclePrice:
            getElement(
                'vehiclePrice'
            )?.value || '',


        service:
            getElement(
                'service'
            )?.value || '',


        start:
            getElement(
                'start'
            )?.value || '',


        end:
            getElement(
                'end'
            )?.value || '',


        area:
            getElement(
                'area'
            )?.value
            ?.trim() || '',


        notes:
            getElement(
                'notes'
            )?.value
            ?.trim() || ''

    };
}


/* =========================================================
   VALIDATE BOOKING
   ========================================================= */

function validateBooking(
    data
) {

    if (!data.name) {
        return 'Nama wajib diisi.';
    }


    if (!data.phone) {
        return 'Nomor WhatsApp wajib diisi.';
    }


    if (!data.vehicleId) {
        return 'Silakan pilih kendaraan.';
    }


    if (!data.service) {
        return 'Silakan pilih layanan.';
    }


    if (!data.start) {
        return 'Tanggal mulai wajib diisi.';
    }


    if (!data.end) {
        return 'Tanggal selesai wajib diisi.';
    }


    if (!data.area) {
        return 'Area wajib diisi.';
    }


    if (
        data.start &&
        data.end &&
        data.end < data.start
    ) {

        return (
            'Tanggal selesai tidak boleh ' +
            'lebih awal dari tanggal mulai.'
        );

    }


    return '';
}


/* =========================================================
   WHATSAPP SUCCESS
   ========================================================= */

function openSuccessWhatsApp(
    formData,
    result
) {

    const bookingCode =
        result?.booking_code ||
        result?.bookingCode ||
        '';


    const vehicleName =
        result?.vehicle_name ||
        result?.vehicleName ||
        formData?.vehicleName ||
        '';


    const message =
        [
            'Halo Transmind Nusantara Rental Mobil,',
            '',
            'Saya sudah melakukan booking.',
            '',
            'Kode Booking: ' +
                bookingCode,

            'Nama: ' +
                (formData?.name || ''),

            'No. HP: ' +
                (formData?.phone || ''),

            'Kendaraan: ' +
                vehicleName,

            'Layanan: ' +
                (formData?.service || ''),

            'Tanggal: ' +
                (formData?.start || '') +
                ' s/d ' +
                (formData?.end || ''),

            'Area: ' +
                (formData?.area || ''),

            'Catatan: ' +
                (formData?.notes || '')

        ].join('\n');


    const url =
        'https://wa.me/' +
        WA_NUMBER +
        '?text=' +
        encodeURIComponent(
            message
        );


    console.log(
        'MEMBUKA WHATSAPP:',
        url
    );


    window.location.href =
        url;
}


/* =========================================================
   WHATSAPP UNAVAILABLE
   ========================================================= */

function openUnavailableWhatsApp(
    formData
) {

    const message =
        [
            'Halo Transmind Nusantara Rental Mobil,',
            '',
            'Saya ingin menanyakan ketersediaan kendaraan.',
            '',
            'Nama: ' +
                (formData?.name || ''),

            'No. HP: ' +
                (formData?.phone || ''),

            'Kendaraan: ' +
                (formData?.vehicleName || ''),

            'Layanan: ' +
                (formData?.service || ''),

            'Tanggal: ' +
                (formData?.start || '') +
                ' s/d ' +
                (formData?.end || ''),

            'Area: ' +
                (formData?.area || ''),

            'Catatan: ' +
                (formData?.notes || '')

        ].join('\n');


    const url =
        'https://wa.me/' +
        WA_NUMBER +
        '?text=' +
        encodeURIComponent(
            message
        );


    window.location.href =
        url;
}


/* =========================================================
   SEND BOOKING EMAIL
   ========================================================= */

async function sendBookingEmail(
    formData,
    result
) {

    console.log(
        'EMAIL BOOKING: MEMULAI PROSES...'
    );


    if (!sb) {

        console.error(
            'EMAIL BOOKING: Supabase belum siap.'
        );


        return {
            success: false,
            error:
                'Supabase belum siap.'
        };
    }


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
        result?.start_at ||
        result?.startAt ||
        formData?.start ||
        '';


    const end =
        result?.end_at ||
        result?.endAt ||
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


    console.log(
        'EMAIL BOOKING: PAYLOAD SIAP:',
        payload
    );


    if (!payload.bookingCode) {

        console.error(
            'EMAIL BOOKING: bookingCode kosong.'
        );


        return {
            success: false,
            error:
                'Kode booking kosong.'
        };
    }


    try {

        console.log(
            'EMAIL BOOKING: MEMANGGIL send-booking-email...'
        );


        const response =
            await sb.functions.invoke(
                'send-booking-email',
                {
                    body: payload
                }
            );


        const data =
            response?.data;


        const error =
            response?.error;


        if (error) {

            console.error(
                'EMAIL BOOKING GAGAL:',
                error
            );


            return {
                success: false,
                error:
                    error.message ||
                    String(error)
            };
        }


        console.log(
            'EMAIL BOOKING RESPONSE:',
            data
        );


        if (
            data &&
            data.success === false
        ) {

            console.error(
                'EMAIL BOOKING DITOLAK FUNCTION:',
                data
            );


            return {
                success: false,
                error:
                    data.error ||
                    'Email gagal dikirim.'
            };
        }


        console.log(
            'EMAIL BOOKING BERHASIL DIKIRIM:',
            data
        );


        return {
            success: true,
            data: data
        };


    } catch (error) {

        console.error(
            'EMAIL BOOKING EXCEPTION:',
            error
        );


        return {
            success: false,
            error:
                error?.message ||
                String(error)
        };
    }
}


/* =========================================================
   SUBMIT BOOKING
   ========================================================= */

async function submitBooking(
    event
) {

    if (event) {
        event.preventDefault();
    }


    console.log(
        '=========================================='
    );


    console.log(
        'SUBMIT BOOKING DIMULAI'
    );


    const formData =
        getFormData();


    console.log(
        'FORM DATA:',
        formData
    );


    const validationError =
        validateBooking(
            formData
        );


    if (validationError) {

        console.warn(
            'VALIDASI BOOKING:',
            validationError
        );


        const resultBox =
            getElement('result');


        if (resultBox) {

            resultBox.innerHTML =
                `
                <div class="error">
                    ${escapeHtml(
                        validationError
                    )}
                </div>
                `;

        }


        return;
    }


    if (!sb) {

        console.error(
            'SUPABASE BELUM SIAP.'
        );


        const resultBox =
            getElement('result');


        if (resultBox) {

            resultBox.innerHTML =
                `
                <div class="error">
                    Sistem belum siap.
                    Silakan refresh halaman.
                </div>
                `;

        }


        return;
    }


    const submitButton =
        document.querySelector(
            '#bookingForm button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.dataset.originalText =
            submitButton.textContent;


        submitButton.textContent =
            'MEMPROSES...';
    }


    try {

        console.log(
            'MEMANGGIL RPC create_booking...'
        );


        const rpcResponse =
            await sb.rpc(
                'create_booking',
                {

                    p_name:
                        formData.name,

                    p_phone:
                        formData.phone,

                    p_vehicle_id:
                        formData.vehicleId,

                    p_service:
                        formData.service,

                    p_start_date:
                        formData.start,

                    p_end_date:
                        formData.end,

                    p_area:
                        formData.area,

                    p_notes:
                        formData.notes

                }
            );


        const result =
            rpcResponse?.data;


        const error =
            rpcResponse?.error;


        console.log(
            'CREATE BOOKING RESULT:',
            result
        );


        if (error) {

            console.error(
                'CREATE BOOKING ERROR:',
                error
            );


            const resultBox =
                getElement('result');


            if (resultBox) {

                resultBox.innerHTML =
                    `
                    <div class="error">
                        Booking gagal:
                        ${escapeHtml(
                            error.message ||
                            'Terjadi kesalahan.'
                        )}
                    </div>
                    `;

            }


            openUnavailableWhatsApp(
                formData
            );


            return;
        }


        const bookingResult =
            Array.isArray(result)
                ? result[0]
                : result;


        if (!bookingResult) {

            console.error(
                'CREATE BOOKING: RESULT KOSONG.'
            );


            const resultBox =
                getElement('result');


            if (resultBox) {

                resultBox.innerHTML =
                    `
                    <div class="error">
                        Sistem tidak menerima
                        hasil booking.
                    </div>
                    `;

            }


            return;
        }


        if (
            bookingResult.success === false
        ) {

            console.warn(
                'BOOKING TIDAK BERHASIL:',
                bookingResult
            );


            const resultBox =
                getElement('result');


            if (resultBox) {

                resultBox.innerHTML =
                    `
                    <div class="error">
                        ${escapeHtml(
                            bookingResult.message ||
                            'Kendaraan tidak tersedia.'
                        )}
                    </div>
                    `;

            }


            openUnavailableWhatsApp(
                formData
            );


            return;
        }


        const bookingCode =
            bookingResult.booking_code ||
            bookingResult.bookingCode ||
            '';


        const vehicleName =
            bookingResult.vehicle_name ||
            bookingResult.vehicleName ||
            formData.vehicleName ||
            '';


        const resultBox =
            getElement('result');


        if (resultBox) {

            resultBox.innerHTML =
                `
                <div class="success">

                    <strong>
                        BOOKING BERHASIL
                    </strong>

                    <br><br>

                    Kode Booking:
                    <strong>
                        ${escapeHtml(
                            bookingCode
                        )}
                    </strong>

                    <br>

                    Kendaraan:
                    ${escapeHtml(
                        vehicleName
                    )}

                    <br><br>

                    Booking sedang dikirim
                    ke sistem administrasi.

                </div>
                `;

        }


        /*
         * EMAIL DIKIRIM DAN DITUNGGU
         * SEBELUM PINDAH KE WHATSAPP.
         */

        const emailResult =
            await sendBookingEmail(
                formData,
                bookingResult
            );


        if (emailResult?.success) {

            console.log(
                'EMAIL BOOKING SUKSES.'
            );

        } else {

            console.warn(
                'EMAIL BOOKING GAGAL:',
                emailResult?.error
            );

        }


        /*
         * Setelah email selesai,
         * baru buka WhatsApp.
         */

        openSuccessWhatsApp(
            formData,
            bookingResult
        );


        setTimeout(
            function() {

                const form =
                    getElement(
                        'bookingForm'
                    );


                if (form) {
                    form.reset();
                }


                updateVehicleInfo();

            },
            1500
        );


    } catch (error) {

        console.error(
            'SUBMIT BOOKING EXCEPTION:',
            error
        );


        const resultBox =
            getElement('result');


        if (resultBox) {

            resultBox.innerHTML =
                `
                <div class="error">

                    Terjadi kesalahan:
                    ${escapeHtml(
                        error?.message ||
                        String(error)
                    )}

                </div>
                `;

        }


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                submitButton.dataset.originalText ||
                'KIRIM BOOKING';

        }

    }
}


/* =========================================================
   SETUP EVENTS
   ========================================================= */

function setupEvents() {

    console.log(
        'SETUP EVENTS: mulai...'
    );


    const bookingForm =
        getElement(
            'bookingForm'
        );


    if (bookingForm) {

        bookingForm.addEventListener(
            'submit',
            submitBooking
        );

    } else {

        console.warn(
            'FORM #bookingForm tidak ditemukan.'
        );

    }


    const vehicleSelect =
        getElement(
            'vehicle'
        );


    if (vehicleSelect) {

        vehicleSelect.addEventListener(
            'change',
            updateVehicleInfo
        );

    }


    console.log(
        'SETUP EVENTS: selesai.'
    );
}


/* =========================================================
   INIT
   ========================================================= */

async function init() {

    console.log(
        'TRANSMIND INIT DIMULAI...'
    );


    /*
     * Pastikan Supabase CDN tersedia.
     */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !==
            'function'
    ) {

        console.error(
            'LIBRARY SUPABASE CDN TIDAK TERSEDIA.'
        );


        setFleetStatus(
            'Library Supabase belum tersedia.'
        );


        return;
    }


    /*
     * Gunakan konfigurasi asli Transmind.
     */

    if (!configured()) {

        console.error(
            'KONFIGURASI SUPABASE TRANSMIND TIDAK TERSEDIA.'
        );


        setFleetStatus(
            'Konfigurasi database belum tersedia.'
        );


        return;
    }


    try {

        sb =
            window.supabase.createClient(
                window.TRANSMIND_SUPABASE_URL,
                window.TRANSMIND_SUPABASE_ANON_KEY
            );


        console.log(
            'SUPABASE CLIENT BERHASIL DIBUAT.'
        );


        /*
         * Jangan tampilkan API key
         * ke console.
         */


        setupEvents();


        await loadVehicles();


        console.log(
            'TRANSMIND INIT SELESAI.'
        );


    } catch (error) {

        console.error(
            'GAGAL MEMBUAT SUPABASE CLIENT:',
            error
        );


        setFleetStatus(
            'Database gagal terhubung.'
        );
    }
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.submitBooking =
    submitBooking;

window.selectVehicle =
    selectVehicle;

window.updateVehicleInfo =
    updateVehicleInfo;

window.handleVehicleImageError =
    handleVehicleImageError;


/* =========================================================
   START APPLICATION
   ========================================================= */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init
    );

} else {

    init();

}
