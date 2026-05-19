const presets = {
    classroom: {
        url: 'https://classroom.google.com/',
        title: 'Home',
        icon: 'https://ssl.gstatic.com/classroom/ic_product_classroom_32.png',
    },
    drive: {
        url: 'https://drive.google.com/',
        title: 'My Drive - Google Drive',
        icon: 'https://ssl.gstatic.com/images/branding/product/2x/hh_drive_36dp.png',
    },
    mail: {
        url: 'https://mail.google.com/',
        title: 'Inbox (12) - Google Mail',
        icon: 'https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_512dp.png',
    },
    canvas: {
        url: 'https://www.instructure.com/',
        title: 'Dashboard',
        icon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico',
    },
    canva: {
        url: 'https://www.canva.com/',
        title: 'Home - Canva',
        icon: 'https://static.canva.com/static/images/favicon.ico',
    },
    m365: {
        url: 'https://m365.cloud.microsoft/search?from=PortalHome&auth=2&origindomain=microsoft365&client-request-id=8f00c2ca-b9d5-43f0-9056-d1cca74442ba',
        title: 'Search | M365 Copilot',
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=microsoft.com',
    },
    nri: {
        url: 'https://www.noredink.com/learn/home',
        title: 'Student Home | NoRedInk',
        icon: 'https://www.noredink.com/favicon.ico',
    },
    nepnav: {
        url: 'https://universal.neptunenavigate.com/course/view/j6orc8CW0xCrSodEmuZ4rAMl32Ml32',
        title: 'Universal - Portal',
        icon: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://universal.neptunenavigate.com&size=64',
    },
    pa: {
        url: 'https://assessment.peardeck.com/home/assignments',
        title: 'Assignments - Pear Assessment',
        icon: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://assessment.peardeck.com/home/assignments&size=64',
    },
    mem: {
        url: 'https://membean.com/dashboard',
        title: 'Dashboard',
        icon: 'https://membean.com/favicon.ico',
    },
    eir: {
        url: 'https://login.i-ready.com/mspro/dashboard/home',
        title: 'Reading Home Page, i-Ready',
        icon: 'https://login.i-ready.com/favicon.ico',
    },
    mir: {
        url: 'https://login.i-ready.com/mspro/dashboard/home',
        title: 'Math Home Page, i-Ready',
        icon: 'https://login.i-ready.com/favicon.ico',
    },
    dm: {
        url: 'https://www.deltamath.com/app/student/4796542/upcoming',
        title: 'DeltaMath Student Application',
        icon: 'https://www.deltamath.com/favicon.ico',
    },
    el: {
        url: 'https://apps.explorelearning.com/gizmos?altRedirectID=0',
        title: 'ExploreLearning Gizmos - Math & Science Simulation for Students',
        icon: 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://explorelearning.com&size=64',
    },
    pl: {
        url: 'https://app.progresslearning.com/classlink?code=c1774361678626941d7d1c9cfefa3f6fbd4cbdf674eca2&response_type=code',
        title: 'Assignments | Progress Learning',
        icon: 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://app.progresslearning.com/&size=64',
    },
    sst: {
        url: 'https://forsyth.studentsupporttime.com/SHome#!/app/dashboard',
        title: 'Thrive - Dashboard',
        icon: 'https://forsyth.studentsupporttime.com/favicon.ico',
    },
    k: {
        url: 'https://kahoot.it/',
        title: 'Kahoot!',
        icon: 'https://kahoot.it/favicon.ico',
    },
    npd: {
        url: 'https://nearpod.com/student/',
        title: 'Nearpod',
        icon: 'https://nearpod.com/favicon.ico',
    },
};

export function applyCloak(cloakName) {
  const selected = cloaks.find(c => c.name === cloakName);
  if (selected) {
    document.title = selected.title;
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = selected.icon;
    document.getElementsByTagName('head')[0].appendChild(link);
    localStorage.setItem('savedCloak', cloakName);
  }
}
