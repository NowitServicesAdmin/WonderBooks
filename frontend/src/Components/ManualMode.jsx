import { useEffect, useMemo, useRef, useState } from "react";
import {
    Cake,
    Palette,
    BookOpen,
    Image,
    Languages,
    Type,
    Check,
    Sparkles,
    MessageCircleHeart,
} from "lucide-react";
import { StepRail } from "./StepRail";
import { CharacterWorkspace } from "./CharacterIllustration";
import { createBook } from "../services/bookService";

/* -------------------------------------------------------------------------- */
/*                                STORY OPTIONS                               */
/* -------------------------------------------------------------------------- */

const STORY_OPTIONS = {
    age: [
        {
            id: "0-3",
            label: "0–3 years",
            description: "Big pictures, simple words, gentle rhythms.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790151734/a168fd94-f163-4e05-aa7e-cac59d283461_j8nzhe.png",
        },
        {
            id: "4-7",
            label: "4–7 years",
            description: "Playful plots with easy, repeatable vocabulary.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790151849/3f87242a-b886-4fd8-b8ab-a13471f49022_cmohcs.png",
        },
        {
            id: "8-13",
            label: "8–13 years",
            description: "Longer stories with richer plots and humor.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790151898/9b669d43-658f-4695-9f3f-8f6c2e193527_zjufvo.png",
        },
        {
            id: "13-17",
            label: "13–17 years",
            description: "Bigger themes for confident young readers.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790152760/0babd66a-90b0-4549-8ffc-8df9b99aee35_wazbff.png",
        },
        {
            id: "18-plus",
            label: "18+ years",
            description: "Nuanced, grown-up storytelling and tone.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790152975/aed3e6c5-15e7-42a2-b54e-1acfeaf482f2_k8nt0u.png",
        },
    ],

    theme: [
        { id: "fairy-tales", label: "Fairy Tales", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153121/bcb37d8e-cea7-47bb-8761-fac5e58a89b5_zyvbhs.png" },
        { id: "adventure", label: "Adventure", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153188/cc2c63af-038d-41d1-b17b-bc6d46c14e1d_nyzurt.png" },
        { id: "activities", label: "Activities", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153256/25ef88b5-bc3e-45b2-8b49-4cdf6e9f0333_ucdrts.png" },
        { id: "worlds", label: "Worlds", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153327/71c93bbd-2037-4c62-93c0-19ffe01c32b6_iwwewn.png" },
        { id: "holidays", label: "Holidays", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153395/7e239870-93ce-4ed5-a4af-dfaeacea3d0e_jatbk4.png" },
        { id: "family", label: "Family", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153462/c1053247-c618-4ac0-a97e-5950c6aaecbd_gmmgkk.png" },
        { id: "education", label: "Education", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153534/0c69d16a-b4b4-4a80-8d86-2cb6ecdef237_duyin2.png" },
        { id: "feelings", label: "Feelings", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153608/9557490b-04e0-416c-b597-25745ccd312e_hjxvyu.png" },
    ],

    // subject options, grouped by theme id
    subject: {
        "fairy-tales": [
            { id: "princess", label: "Princesses & Princes", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153878/28e0f5d5-d335-4733-bac9-c51b3b0d50fa_mqbqau.png" },
            { id: "magic", label: "Magic & Spells", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790153953/072a7d21-999e-4522-95bb-b0bd9a664236_nkcior.png" },
            { id: "dragons", label: "Dragons", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154024/af6ce346-9871-40e4-ab32-15ef3e79cca8_tupxpr.png" },
            { id: "unicorns", label: "Unicorns", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154081/3d38e534-b942-4472-9452-3b53c5372e18_jhpwlm.png" },
            { id: "enchanted-forest", label: "Enchanted Forest", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154138/04471a96-366c-41b2-8bb4-31009e6b5376_zl7fiy.png" },
            { id: "talking-animals", label: "Talking Animals", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154221/0d1d39c5-f1c3-4091-be89-90661be63e3c_pxwb9o.png" },
        ],
        adventure: [
            { id: "treasure-hunt", label: "Treasure Hunt", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154374/64cc0563-0c3f-4a84-99cc-ce0ba5e34914_hzj1ps.png" },
            { id: "space", label: "Space Journey", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154501/2d9bf29d-2013-4593-8387-c9e7e5af6965_rdr1hl.png" },
            { id: "jungle", label: "Jungle Expedition", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154528/f13846be-c798-4250-91e9-6f827ef56fbc_iobhop.png" },
            { id: "ocean", label: "Underwater Adventure", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154597/35b872a7-1163-47ab-a27e-06b71f3d7cc0_vpjzvj.png" },
            { id: "mountains", label: "Mountain Expedition", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154664/e529129b-405f-464d-b1dc-e7b2ad2946d1_oz9ytk.png" },
            { id: "mystery", label: "Mystery & Exploration", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154734/ef357e69-132d-4fe5-a11b-6b9b06a4a301_smpqmn.png" },
        ],
        activities: [
            { id: "camping", label: "Camping", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154858/832d104e-3261-488d-916d-89c99bdf41c1_bieyjn.png" },
            { id: "sports", label: "Sports", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154919/5afd4d9e-b3af-40c3-af68-11bf83d5902c_fpgixx.png" },
            { id: "cooking", label: "Cooking", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790154981/31876f59-1acc-4f9d-b0d2-d11d63ebab93_d1hvc4.png" },
            { id: "art", label: "Art & Drawing", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155032/c3334865-bf64-49eb-8632-a0a89bba8618_dk18ie.png" },
            { id: "music", label: "Music & Dancing", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155088/bed8ee98-eecf-4312-92e7-a25466326428_pdivuh.png" },
            { id: "school-trip", label: "School Trip", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155153/8543c89f-fe89-4029-8177-7e97bb02a089_fwjlyn.png" },
        ],
        worlds: [
            { id: "space-world", label: "Outer Space", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155249/e1914bdf-d7d8-4977-aa2d-5a9c9ff12cd5_r7tcob.png" },
            { id: "underwater-world", label: "Underwater World", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155310/30c6eb3e-95b2-44cc-84b7-41911ddfbd30_mbrzqz.png" },
            { id: "dinosaur-world", label: "Dinosaur World", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155389/13eb168b-b2ce-4818-9314-3b114b8ffcfd_f1deaf.png" },
            { id: "robot-world", label: "Robot World", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155460/f3c7e4bf-de1b-46ed-a848-3d2ab306276b_ous2rg.png" },
            { id: "fantasy-world", label: "Fantasy World", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155524/78fa047d-fab3-42ea-84e5-0e763be29487_payldk.png" },
            { id: "future-world", label: "Future World", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155592/9a0d8aaa-9253-4e95-88c6-7918e6d09dcf_mqpmlj.png" },
        ],
        holidays: [
            { id: "christmas", label: "Christmas", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155812/e52248cf-336f-4eae-977f-faf91e8cbbb9_c9ho95.png" },
            { id: "halloween", label: "Halloween", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155867/f361e633-1257-4b70-ac46-d85ba36661f8_idl6hf.png" },
            { id: "birthday", label: "Birthday", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155915/ce0071f4-e9f9-4269-bb92-ead6a0a093cd_l8at89.png" },
            { id: "new-year", label: "New Year", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790155972/1e1d0a97-5fdf-4b28-bf0d-9c7afd4753fb_uqlhgq.png" },
            { id: "diwali", label: "Diwali", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156030/5a0e2ec1-04f4-48ae-ab12-232705d71b62_ve6tlp.png" },
            { id: "vacation", label: "Holiday Vacation", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156103/9cee1649-fd0a-4645-8589-c405426184c0_ehdshi.png" },
        ],
        family: [
            { id: "family-trip", label: "Family Trip", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156252/c64dea34-4b05-4037-85ee-41bb4cb2d1b2_nlexll.png" },
            { id: "siblings", label: "Brothers & Sisters", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156305/e2bc9877-ffa1-40a5-9744-ea0537b20ded_mflivj.png" },
            { id: "grandparents", label: "Grandparents", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156370/693c9c90-389e-4b50-9491-fdf632e6f5c3_zh8kq7.png" },
            { id: "family-pet", label: "Family Pet", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156422/6c568be3-6fb7-4eb7-ac8b-04082b7580fa_oy39bm.png" },
            { id: "new-baby", label: "New Baby", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156497/1606568b-74e6-4246-95b0-a24154b80a3a_b0tuqh.png" },
            { id: "family-day", label: "Family Day", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156552/899033c7-5d3c-4097-a85f-07521cc26d53_uvqqj2.png" },
        ],
        education: [
            { id: "science", label: "Science", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156632/bcf6051e-1b2d-47a4-8062-071e4fa85f7d_bfn7z1.png" },
            { id: "math", label: "Math & Numbers", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156691/9ecd6916-d922-433e-b462-48ca081923bd_mpoahz.png" },
            { id: "reading", label: "Reading", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156747/685dfee4-641a-4deb-b04e-d6071908d850_rjft2v.png" },
            { id: "history", label: "History", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156803/14706160-986f-4fcc-945e-a2a77d67e757_zbf4zr.png" },
            { id: "nature", label: "Nature & Animals", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156859/3b2a3591-32c4-42ac-a517-b9ea48880a55_cmcnwa.png" },
            { id: "problem-solving", label: "Problem Solving", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790156911/72cf8a2b-9d9b-408e-b78f-f4672dd00c54_uoww1u.png" },
        ],
        feelings: [
            { id: "friendship", label: "Friendship", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157089/e731c512-e43c-4dc0-b19e-2cb01da5b456_gjbdi5.png" },
            { id: "confidence", label: "Confidence", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157160/2ec9924f-83e2-4589-ab99-636e3742daf3_egkzzh.png" },
            { id: "kindness", label: "Kindness", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157197/7cef63d6-cc35-40dc-884b-2a897eb25c7d_avp97w.png" },
            { id: "jealousy", label: "Jealousy", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157251/8b5a2518-60de-40a6-9d46-6a5db6e88cbf_xpt0it.png" },
            { id: "fear", label: "Overcoming Fear", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157301/2b6b1be4-46c8-499f-bc74-2f8d338eeeeb_igmqtk.png" },
            { id: "empathy", label: "Empathy", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157362/c0501b06-b843-4b2d-8b58-e4f0de77d126_gaoqw3.png" },
        ],
    },

    // central message options, grouped by theme id
    centralmsg: {
        "fairy-tales": [
            { id: "believe", label: "Believe in Yourself", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157599/adcefda5-f5bd-4d9d-bfd4-3f7d9a4a8dbb_bicwj1.png" },
            { id: "kindness", label: "Kindness Wins", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157668/636a8d66-01ae-4e59-91c3-e08e6d06bbb9_nghp9u.png" },
            { id: "courage", label: "Be Brave", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157723/08618b9d-67fe-49e8-bf17-c47ac482ba57_gr5f3a.png" },
            { id: "friendship", label: "True Friendship", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157776/536f91a3-c670-41b9-a8f6-675bbc89778d_i7e83d.png" },
            { id: "hope", label: "Never Lose Hope", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157830/09d37b9a-b535-440f-becb-762dc4fd4077_tjhoso.png" },
            { id: "goodness", label: "Goodness Overcomes Evil", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157882/f4f01105-9dd9-4c8d-bd0f-79aa381dfff2_wr67ag.png" },
        ],
        adventure: [
            { id: "courage", label: "Courage", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157964/9177fc07-1bd0-47a5-81ee-77e918ce58a8_xhxsde.png" },
            { id: "perseverance", label: "Never Give Up", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158032/1925d752-6876-404d-b16c-bfb236cdaff5_ifwxzt.png" },
            { id: "teamwork", label: "Teamwork", image:"https://res.cloudinary.com/dakiwpzly/image/upload/v1790158094/aa78ca5c-6bcf-47f0-a614-4760438fa61e_hhcb8c.png" },
            { id: "curiosity", label: "Stay Curious", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158146/212a3855-7ec7-48cc-852e-2efc5bdc8e51_uqef5w.png" },
            { id: "confidence", label: "Believe in Yourself", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158199/3e1502c8-da3b-4760-8d60-349b3d35428e_y0guuf.png" },
            { id: "responsibility", label: "Take Responsibility", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158292/b8230cf9-0396-446e-bc5f-59f5e9dd6bfa_c6m2a7.png" },
        ],
        activities: [
            { id: "teamwork", label: "Working Together", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158368/239d78cb-5ecf-4bf9-9047-9e53b3ee1a97_a1ovpo.png" },
            { id: "practice", label: "Practice Makes Progress", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158417/9ae20909-795b-4091-a423-fb6deebbed12_tmwg5c.png"  },
            { id: "creativity", label: "Be Creative", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158464/9b719d5f-83c5-4c20-9135-b217efa5d61e_iwwfuy.png"  },
            { id: "patience", label: "Be Patient", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158512/d57530fc-9764-4178-8bf1-49f54dc7d177_eucfsx.png"  },
            { id: "sharing", label: "Sharing With Others", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158563/623cd943-9ff6-4bd2-8271-4311f93bbff2_rwbbbu.png"  },
            { id: "fun", label: "Enjoy the Journey", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158628/ae0b90b4-7990-42d3-b387-69c6fdb8cf78_bneuww.png"  },
        ],
        worlds: [
            { id: "curiosity", label: "Explore the Unknown", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158690/3c03e3e8-8893-410e-953c-ac79870aa5c7_plqbtt.png"  },
            { id: "friendship", label: "Friendship Across Worlds", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158740/a10f471c-3a46-4648-bf57-e5a5d899575b_wvsap8.png"  },
            { id: "teamwork", label: "Teamwork", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158094/aa78ca5c-6bcf-47f0-a614-4760438fa61e_hhcb8c.png"  },
            { id: "discovery", label: "Learning Through Discovery", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158815/7cfb407d-26f6-43c8-a0e8-0650e7e1bac1_mgfro2.png"  },
            { id: "courage", label: "Face the Unknown With Courage", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790158865/bb9c8222-5810-4ec3-bf16-c73b558ed217_mce2xc.png"  },
            { id: "imagination", label: "The Power of Imagination", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159555/7183e800-3040-4b2f-92f1-bf953c76b09c_orjiza.png"  },
        ],
        holidays: [
            { id: "togetherness", label: "Togetherness", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159671/43fb5ec0-33aa-44d4-840d-1a1038404d4e_qduyqn.png"  },
            { id: "gratitude", label: "Be Grateful", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159717/39ee6345-99a8-48c3-a527-cd18ff07d19e_yprial.png"  },
            { id: "giving", label: "The Joy of Giving", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159764/2ac271fb-728b-4c9e-9d8a-983bce841642_d6xljf.png"  },
            { id: "family", label: "Family Matters", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159811/ff6b77a1-d446-4684-8bc8-bd5fce61eb32_g2wcdi.png"  },
            { id: "kindness", label: "Spread Kindness", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159903/c7bfaae9-a3b7-4ee4-97c2-4bcef8689bff_rbt0g5.png"  },
            { id: "celebration", label: "Celebrate Life", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159924/f326cadc-461f-4686-94b7-d8dbeb208100_sa6z3v.png"  },
        ],
        family: [
            { id: "love", label: "Family Love", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159964/8f599501-9785-4b66-b34b-8b9f6063da91_fxgs2q.png"  },
            { id: "togetherness", label: "Together Is Better", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160050/ba1b6a03-848b-48c7-b886-8fc643b7092c_zxsiac.png"  },
            { id: "respect", label: "Respect Each Other", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160075/d9bc6d7f-2a70-4ce9-8ed4-d39eaf1c690a_gbse1v.png"  },
            { id: "forgiveness", label: "Learn to Forgive", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160134/5abd7ed9-dbcd-4be2-b75b-f4f8485e9f12_tsz8ft.png"  },
            { id: "helping", label: "Help One Another", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160189/f407fb00-2565-45af-931a-f07419d5dfff_iurvt5.png"  },
            { id: "gratitude", label: "Appreciate Your Family", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160240/fd422cb3-b881-4bd0-80b0-12e59739f435_igjulf.png"  },
        ],
        education: [
            { id: "curiosity", label: "Stay Curious", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160308/66da93c9-d014-4d58-9cb2-384d692eff9c_m2yo2x.png"  },
            { id: "learning", label: "Learning Is an Adventure", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160349/6f4b90e0-2353-468d-97dc-21a3ab314797_o8wjh6.png"  },
            { id: "perseverance", label: "Keep Trying", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160436/9470a593-35e1-441d-9703-6cf352297cdd_n2cvwi.png"  },
            { id: "problem-solving", label: "Think of Solutions", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160469/1d0c3f95-1683-4d75-9bc3-1cf1118f613f_sm2enz.png"  },
            { id: "confidence", label: "Believe You Can Learn", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160599/f774ac06-e75e-431a-8e7b-125eaab61ad6_u9meg5.png"  },
            { id: "creativity", label: "Think Creatively", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160650/8a74970e-4892-49dd-abaa-5672afd688e5_o7ystb.png"  },
        ],
        feelings: [
            { id: "friendship", label: "Friendship", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790157089/e731c512-e43c-4dc0-b19e-2cb01da5b456_gjbdi5.png"  },
            { id: "empathy", label: "Understand Others", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160775/57d24b19-2146-4328-b4f9-84306da2ee6f_yobxkt.png"  },
            { id: "confidence", label: "Believe in Yourself", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160826/bb44d2e7-7f33-468c-8cc1-bcf045bccb1a_va6coq.png"  },
            { id: "kindness", label: "Choose Kindness", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790159717/39ee6345-99a8-48c3-a527-cd18ff07d19e_yprial.png"  },
            { id: "emotional-awareness", label: "Understand Your Feelings", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160925/1d1b61e7-949b-4dec-b4c4-b165639f34c8_jtu2bb.png"  },
            { id: "resilience", label: "Be Strong Through Challenges", image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790160993/5b4a9295-cd31-4b42-aedc-b1e1294a7405_v7dtqp.png"  },
        ],
    },

    imageStyle: [
        {
            id: "3d",
            label: "3D Storybook",
            description: "Cinematic, expressive characters with depth and detail. Perfect for modern children's stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790075085/6ef597c0-c295-42c7-93ee-9821e2adcad7_cqfn7m.png",
        },
        {
            id: "watercolor",
            label: "Watercolour",
            description: "Hand-painted, dreamy visuals with soft colours. Ideal for gentle and emotional stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790075160/83527e1b-7840-4ab8-a862-33a98b6c2c12_o5cxje.png",
        },
        {
            id: "classic-illustrated",
            label: "Classic Illustrated",
            description: "Timeless storybook style with rich textures and warm tones. Great for traditional tales.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790075304/ca533bbe-bc4b-4d97-ac9b-226cddfc4217_grq8q3.png",
        },
        {
            id: "picture-book",
            label: "Picture Book (Kids)",
            description: "Simple, colourful and friendly visuals. Perfect for early readers and playful stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790075741/f3f0e914-ff65-4f6e-bbae-1fd6023ac83c_z6pwbd.png",
        },
        {
            id: "sketch",
            label: "Black & White (Sketch)",
            description: "Clean hand-drawn sketches. Perfect for draft versions or a minimal, classic look.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076399/508abf41-241c-44ec-aa00-a0aa262cc9ac_yqwwdk.png",
        },
        {
            id: "minimal-modern",
            label: "Minimal / Modern",
            description: "Clean and modern visuals with minimal details. Works well for educational and moral stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076669/02432874-e5dc-4f33-bb2b-08663ab86ddd_vehdub.png",
        },
        {
            id: "vintage-retro",
            label: "Vintage / Retro",
            description: "Nostalgic, old-book charm with textured and muted tones. Perfect for classic and heritage stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076776/323cb471-e4bd-4226-b435-f60beace0435_o1bobj.png",
        },
        {
            id: "fairy-tale",
            label: "Fairy Tale",
            description: "Magical and enchanting visuals with a dreamy atmosphere. Perfect for fantasy stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790075909/de372c9c-c1d8-4bb0-ac17-28a430642053_zfmyg8.png",
        },
        {
            id: "night-bedtime",
            label: "Night / Bedtime",
            description: "Calming, cosy visuals for bedtime stories. Creates a warm and soothing mood.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076015/1af04a9a-900c-417c-8a7e-8476166edaf6_dcmdur.png",
        },
        {
            id: "adventure-style",
            label: "Adventure",
            description: "Bold and dynamic visuals for exciting journeys and exploration stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076141/800003a9-156c-4931-9dbe-dfe49c372a8e_wxtfny.png",
        },
        {
            id: "line-art",
            label: "Line Art (Colouring)",
            description: "Simple outlines for colouring books. Great for interactive and activity-based stories.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076557/fbbbeb51-b726-4411-a16c-4f3ec7d5282e_ljqce2.png",
        },
        {
            id: "seasonal-autumn",
            label: "Seasonal (Autumn)",
            description: "Rich seasonal colours and atmosphere. Great for stories set in different times of the year.",
            image: "https://res.cloudinary.com/dakiwpzly/image/upload/v1790076266/3d5fd589-efb4-4efc-b293-fa3b7ce091da_efgead.png",
        },
        
    ],

    language: [
        { id: "english", label: "English", emoji: "🇬🇧" },
        { id: "spanish", label: "Spanish", emoji: "🇪🇸" },
        { id: "french", label: "French", emoji: "🇫🇷" },
        { id: "german", label: "German", emoji: "🇩🇪" },
        { id: "italian", label: "Italian", emoji: "🇮🇹" },
        { id: "portuguese", label: "Portuguese", emoji: "🇵🇹" },
        { id: "dutch", label: "Dutch", emoji: "🇳🇱" },
        { id: "hindi", label: "Hindi", emoji: "🇮🇳" },
        { id: "arabic", label: "Arabic", emoji: "🇸🇦" },
        { id: "japanese", label: "Japanese", emoji: "🇯🇵" },
        { id: "chinese", label: "Chinese", emoji: "🇨🇳" },
        { id: "korean", label: "Korean", emoji: "🇰🇷" },
    ],

    font: [
        { id: "rounded", label: "Rounded & Playful", fontFamily: '"Baloo 2", "Comic Sans MS", cursive' },
        { id: "serif", label: "Classic Storybook", fontFamily: 'Georgia, "Times New Roman", serif' },
        { id: "handwritten", label: "Handwritten", fontFamily: '"Segoe Script", "Bradley Hand", cursive' },
        { id: "sans", label: "Clean & Modern", fontFamily: '"Poppins", "Helvetica Neue", Arial, sans-serif' },
        { id: "bubbly", label: "Bubbly & Bold", fontFamily: '"Fredoka One", "Baloo 2", cursive' },
        { id: "whimsical", label: "Whimsical", fontFamily: '"Chewy", "Comic Sans MS", cursive' },
        { id: "elegant", label: "Elegant Script", fontFamily: '"Dancing Script", "Segoe Script", cursive' },
        { id: "typewriter", label: "Typewriter", fontFamily: '"Courier New", Courier, monospace' },
    ],
};

const PANEL_META = {
    age: { icon: Cake, heading: "Age group", description: "Select the perfect age range for your story." },
    theme: { icon: Palette, heading: "Theme", description: "What kind of world should your story explore?" },
    subject: { icon: BookOpen, heading: "Subject", description: "What should your story focus on?" },
    centralmsg: { icon: MessageCircleHeart, heading: "Central message", description: "What's the takeaway you want readers to feel?" },
    imageStyle: { icon: Image, heading: "Image style", description: "Select how your story should look." },
    language: { icon: Languages, heading: "Language", description: "Select the language for your story." },
    font: { icon: Type, heading: "Font style", description: "Pick the lettering that fits the mood." },
};
const STEPS = [
    {
        id: "age-theme",
        number: 1,
        title: "Choose Your Age & Theme",
        subtitle: "Who it's for, and the mood we're setting",
        categories: ["age", "theme"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111515-Photoroom_duoph2.png"
    },
    {
        id: "subject",
        number: 2,
        title: "Subject",
        subtitle: "What should your story focus on?",
        categories: ["subject"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111521-Photoroom_e5cpyr.png"
    },
    {
        id: "centralmsg",
        number: 3,
        title: "Central Message",
        subtitle: "What's the takeaway you want readers to feel?",
        categories: ["centralmsg"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111528-Photoroom_p6dh2j.png"
    },
    {
        id: "imageStyle",
        number: 4,
        title: "Image Style",
        subtitle: "Pick the art style that brings it to life",
        categories: ["imageStyle"],
        image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760656/Screenshot_2026-09-07_111532-Photoroom_yktpxn.png"
    },
];

const CHARACTER_STEP = {
    id: "character",
    number: 5,
    title: "Character",
    subtitle: "Give your hero a name and a face",
    categories: [],
    optional: true,
    image: "https://res.cloudinary.com/djdct0pxu/image/upload/v1788760470/Screenshot_2026-09-07_111538-Photoroom_tehazn.png"
};
const ALL_STEPS = [...STEPS, CHARACTER_STEP];

// Categories whose available options depend on the selected theme.
const THEME_DEPENDENT_CATEGORIES = new Set(["subject", "centralmsg"]);

// Returns the option list for a category, resolving theme-dependent ones
// (subject / centralmsg) against the currently selected theme.
const getOptionsForCategory = (categoryId, selections) => {
    const source = STORY_OPTIONS[categoryId];
    if (!source) return [];
    if (THEME_DEPENDENT_CATEGORIES.has(categoryId)) {
        const themeId = selections?.theme?.id;
        return (themeId && source[themeId]) || [];
    }
    return source;
};

// help logic
const isStepComplete = (step, selections, characters) => {
    if (step.id === "character") return characters.length > 0;
    return step.categories.every((categoryId) => !!selections[categoryId]);
};
// styles
const AnimationStyles = () => (
    <style>{`
        @keyframes chipDrop {
            0%   { transform: translateY(-14px) scale(0.85); opacity: 0; }
            55%  { transform: translateY(3px) scale(1.05);  opacity: 1; }
            75%  { transform: translateY(-2px) scale(0.98); }
            100% { transform: translateY(0) scale(1); }
        }
        .animate-chip-drop {
            animation: chipDrop 480ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .option-flying-ghost {
            transition-property: top, left, width, height, opacity, transform;
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes cardFadeIn {
            0%   { opacity: 0; transform: translateY(10px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-card-fade-in {
            animation: cardFadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes selectPulse {
            0%   { box-shadow: 0 0 0 0 rgba(105,71,215,0.35); }
            100% { box-shadow: 0 0 0 10px rgba(105,71,215,0); }
        }
        .animate-select-pulse {
            animation: selectPulse 600ms ease-out;
        }
    `}</style>
);
// animation
const FlyingGhost = ({ ghost, onLanded }) => {
    const [landed, setLanded] = useState(false);

    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setLanded(true));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
    }, []);
    const rect = landed ? ghost.target : ghost.source;
    return (
        <div
            className="option-flying-ghost pointer-events-none fixed z-999 flex items-center justify-center overflow-hidden rounded-2xl border border-[#d9cdf5] bg-white shadow-[0_16px_34px_rgba(105,71,215,0.30)]"
            style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                opacity: landed ? 0.15 : 1,
                transitionDuration: "520ms",
            }}
            onTransitionEnd={(event) => {
                if (event.propertyName === "top") onLanded(ghost.key);
            }}
        >
            {ghost.option.image ? (
                <img src={ghost.option.image} alt="" className="h-8 w-8 object-contain" />
            ) : ghost.option.emoji ? (
                <span className="text-xl leading-none">{ghost.option.emoji}</span>
            ) : ghost.option.fontFamily ? (
                <span style={{ fontFamily: ghost.option.fontFamily }} className="text-lg font-bold">
                    Aa
                </span>
            ) : (
                <span className="text-[11px] font-bold text-[#6947d7]">{ghost.option.label}</span>
            )}
        </div>
    );
};

// optionCards

const CompactOptionCard = ({ option, isSelected, onSelect, index = 0 }) => {
    const hasImage = Boolean(option.image);

    return (
        <button
            type="button"
            onClick={(event) => onSelect(option, event)}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className={`
        group relative aspect-square w-full max-w-30
        animate-card-fade-in
        overflow-hidden rounded-[20px] border
        transition-all duration-200
        ${isSelected
                    ? "border-[#7252dc] shadow-[0_10px_24px_rgba(105,71,215,0.16)] animate-select-pulse"
                    : "border-[#e5e1eb] hover:-translate-y-0.5 hover:border-[#c9bce9] hover:shadow-[0_8px_20px_rgba(87,67,150,0.08)]"
                }
      `}
        >
            {/* Background: image fills the whole tile */}
            {hasImage ? (
                <img
                    src={option.image}
                    alt={option.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
            ) : (
                <div
                    className={`absolute inset-0 flex items-center justify-center ${isSelected ? "bg-[#f6f2ff]" : "bg-[#faf8fd]"
                        }`}
                >
                    {option.fontFamily ? (
                        <span
                            style={{ fontFamily: option.fontFamily }}
                            className="text-[46px] font-bold leading-none text-[#4c4457]"
                        >
                            Aa
                        </span>
                    ) : (
                        <span className="text-[52px] leading-none">{option.emoji}</span>
                    )}
                </div>
            )}

            {/* Heading, as a frosted glass pill sitting on top of the image, showing the full title */}
            <div className="absolute inset-x-0 top-1.5 px-1.5">
                <span
                    className={`
                        block w-full rounded-xl px-1.5 py-1
                        text-center text-[9.5px] font-bold leading-tight
                        break-words whitespace-normal
                        backdrop-blur-md backdrop-saturate-150
                        shadow-[0_3px_10px_rgba(31,15,74,0.35)] ring-1
                        ${hasImage
                            ? isSelected
                                ? "bg-[#6947d7]/75 text-white ring-white/40"
                                : "bg-[#2b1f52]/55 text-white ring-white/25"
                            : isSelected
                                ? "bg-[#6947d7]/75 text-white ring-white/40"
                                : "bg-white/70 text-[#3f4254] ring-black/10"
                        }
                    `}
                >
                    {option.label}
                </span>
            </div>

            {/* Selected badge floats over the top-right corner of the tile */}
            {isSelected && (
                <div className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#6947d7] text-white shadow-[0_2px_6px_rgba(31,23,63,0.28)] ring-2 ring-white">
                    <Check size={11} strokeWidth={3} />
                </div>
            )}

            {isSelected && (
                <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#7252dc]" />
            )}
        </button>
    );
};

const IMAGE_STYLE_PALETTE = ["#f7ded1", "#dbe6e7", "#f6d9e1", "#f3dee1", "#e4dcf2", "#dcecdd"];
const IMAGE_STYLE_TEXT_TINT = ["#f7ded1", "#dbe6e7", "#f6d9e1", "#f3dee1", "#e4dcf2", "#dcecdd"];

const ImageStyleCard = ({ option, isSelected, onSelect, index = 0 }) => {
    const tint = IMAGE_STYLE_PALETTE[index % IMAGE_STYLE_PALETTE.length];
    const textTint = IMAGE_STYLE_TEXT_TINT[index % IMAGE_STYLE_TEXT_TINT.length];

    return (
        <button
            type="button"
            onClick={(event) => onSelect(option, event)}
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            className={`
        group relative flex w-full flex-col overflow-hidden rounded-2xl
        border-2 bg-white text-left
        animate-card-fade-in
        transition-all duration-200
        ${isSelected
                    ? "border-[#e6791b] shadow-[0_10px_26px_rgba(230,121,27,0.18)] animate-select-pulse"
                    : "border-transparent hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(87,67,150,0.10)]"
                }
      `}
        >
            {/* Photo fills the whole panel */}
            <div
                className="relative aspect-4/3 w-full overflow-hidden"
                style={{ backgroundColor: tint }}
            >
                {option.image && (
                    <img
                        src={option.image}
                        alt={option.label}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                )}
                {isSelected && (
                    <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#e6791b] text-white shadow-sm">
                        <Check size={12} strokeWidth={3} />
                    </div>
                )}
            </div>

            {/* Title + description — tinted to match the photo above it */}
            <div
                className="px-3 py-2.5 transition-colors duration-200"
                style={{ backgroundColor: isSelected ? "#fdf0e4" : textTint }}
            >
                <h4
                    className={`text-[12.5px] font-bold leading-tight ${isSelected ? "text-[#e6791b]" : "text-[#2f2b3d]"
                        }`}
                >
                    {option.label}
                </h4>
                {option.description && (
                    <p className="mt-1 text-[10.5px] leading-snug text-[#928c9c]">
                        {option.description}
                    </p>
                )}
            </div>
        </button>
    );
};


const CategoryPanel = ({ categoryId, selections, onSelect, showHeader }) => {
    const meta = PANEL_META[categoryId];
    const options = getOptionsForCategory(categoryId, selections);
    const selectedOption = selections[categoryId];
    const Icon = meta?.icon;
    const isImageStyle = categoryId === "imageStyle";
    const themeMissing = THEME_DEPENDENT_CATEGORIES.has(categoryId) && !selections?.theme;

    return (
        <div
            className={
                showHeader
                    ? "rounded-[20px] border border-[#eeeaf2] bg-white p-5"
                    : ""
            }
        >
            {showHeader && (
                <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eee9ff] text-[#6241cc]">
                        {Icon && <Icon size={15} />}
                    </div>
                    <div>
                        <h3 className="text-[14px] font-bold text-[#3f3b53]">{meta?.heading}</h3>
                        <p className="text-[11px] text-[#928c9c]">{meta?.description}</p>
                    </div>
                </div>
            )}

            {themeMissing ? (
                <div className="rounded-2xl border border-dashed border-[#e5e1eb] bg-[#faf8fd] p-6 text-center text-[13px] text-[#928c9c]">
                    Pick a theme first to see matching options here.
                </div>
            ) : isImageStyle ? (
                <div
                    className="
                grid
                w-full min-w-0
                grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
                gap-4
                overflow-hidden
                py-1
            "
                >
                    {options.map((option, index) => (
                        <ImageStyleCard
                            key={option.id}
                            option={option}
                            index={index}
                            isSelected={selectedOption?.id === option.id}
                            onSelect={(value, event) => onSelect(categoryId, value, event)}
                        />
                    ))}
                </div>
            ) : (
                <div className="
        grid
        w-full min-w-0
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
        gap-3.5
        overflow-hidden
        py-1
    "
                >
                    {options.map((option, index) => (
                        <CompactOptionCard
                            key={option.id}
                            option={option}
                            index={
                                index
                            }
                            isSelected={selectedOption?.id === option.id}
                            onSelect={(value, event) => onSelect(categoryId, value, event)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// step work space 
const StepWorkspace = ({ step, selections, onSelect }) => {
    const hasMultiplePanels = step.categories.length > 1;
    const isAgeThemeStep = step.id === "age-theme";

    const chipRefs = useRef({});
    const [flyingGhosts, setFlyingGhosts] = useState([]);
    const [animatingSet, setAnimatingSet] = useState(() => new Set());

    const handleSelectWithFlight = (categoryId, option, event) => {
        const sourceEl = event?.currentTarget;
        const targetEl = chipRefs.current[categoryId];

        // Update the real selection right away so downstream logic
        // (step completion, auto-advance) is never blocked by the animation.
        onSelect(categoryId, option);

        if (!sourceEl || !targetEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const key = `${categoryId}-${option.id}-${Date.now()}`;

        setAnimatingSet((previous) => new Set(previous).add(categoryId));

        setFlyingGhosts((previous) => [
            ...previous,
            {
                key,
                categoryId,
                option,
                source: {
                    top: sourceRect.top,
                    left: sourceRect.left,
                    width: sourceRect.width,
                    height: sourceRect.height,
                },
                target: {
                    top: targetRect.top + targetRect.height / 2 - 12,
                    left: targetRect.left + 10,
                    width: 24,
                    height: 24,
                },
            },
        ]);
    };

    const handleGhostLanded = (key) => {
        setFlyingGhosts((previous) => {
            const ghost = previous.find((item) => item.key === key);
            if (ghost) {
                setAnimatingSet((prevSet) => {
                    const next = new Set(prevSet);
                    next.delete(ghost.categoryId);
                    return next;
                });
            }
            return previous.filter((item) => item.key !== key);
        });
    };

    return (
        <section
            className="
        flex h-full min-h-0 flex-1 flex-col
        rounded-[26px] border border-[#e6e1ee] 
        p-6 shadow-[0_10px_30px_rgba(87,67,150,0.05)]
      "
        >
            <AnimationStyles />

            <div className="shrink-0 border-[#eeeaf2]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eee9ff] text-[#6241cc]">
                        <Sparkles size={19} />
                    </div>
                    <div>
                        <h2 className="text-[14px] text-[#291ef5]">{step.title}</h2>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-6">
                <div className="space-y-5">
                    {step.categories.map((categoryId) => (
                        <CategoryPanel
                            key={categoryId}
                            categoryId={categoryId}
                            selections={selections}
                            onSelect={handleSelectWithFlight}
                            showHeader={hasMultiplePanels}
                        />
                    ))}
                </div>
            </div>

            {flyingGhosts.map((ghost) => (
                <FlyingGhost key={ghost.key} ghost={ghost} onLanded={handleGhostLanded} />
            ))}
        </section>
    );
};

export const ManualMode = () => {
    const [activeStepId, setActiveStepId] = useState(STEPS[0].id);

    const [selections, setSelections] = useState({
        age: null,
        theme: null,
        subject: null,
        centralmsg: null,
        imageStyle: null,
        language: null,
        font: null,
    });

    const [characters, setCharacters] = useState([]);

    const activeStepIndex = useMemo(
        () => ALL_STEPS.findIndex((step) => step.id === activeStepId),
        [activeStepId],
    );
    const activeStep = ALL_STEPS[activeStepIndex];
    const isCharacterStep = activeStep.id === "character";
    const isFirstStep = activeStepIndex === 0;
    const isLastStep = activeStepIndex === ALL_STEPS.length - 1;


    const handleOptionSelect = (categoryId, option) => {
        const ownerStep = STEPS.find((step) => step.categories.includes(categoryId));

        setSelections((previous) => {
            const next = { ...previous, [categoryId]: option };

            // Changing the theme invalidates any previously chosen subject /
            // central message, since those lists are theme-specific.
            if (categoryId === "theme" && previous.theme?.id !== option.id) {
                next.subject = null;
                next.centralmsg = null;
            }

            return next;
        });

        if (!ownerStep) return; // language/font: just store, no auto-advance/step logic

        const stepNowComplete = ownerStep.categories.every((id) =>
            id === categoryId ? true : !!selections[id],
        );

        if (stepNowComplete && ownerStep.id === activeStepId) {
            const ownerIndex = ALL_STEPS.findIndex((step) => step.id === ownerStep.id);
            const nextStep = ALL_STEPS[ownerIndex + 1];
            if (nextStep) {
                setTimeout(() => setActiveStepId(nextStep.id), 650);
            }
        }
    };

    /* ------------------------------- Clear step ------------------------------ */

    const handleClearStep = (step) => {
        if (step.id === "character") {
            setCharacters([]);
            return;
        }

        setSelections((previous) => {
            const next = { ...previous };
            step.categories.forEach((categoryId) => {
                next[categoryId] = null;
            });
            return next;
        });
    };

    const handleCreateStory = async () => {
        const missingSteps = STEPS.filter(
            (step) => !isStepComplete(step, selections, characters)
        );

        if (missingSteps.length > 0) {
            alert(
                `Please complete: ${missingSteps
                    .map((step) => step.title)
                    .join(", ")}`
            );

            setActiveStepId(missingSteps[0].id);
            return;
        }

        const formData = new FormData();

        formData.append("mode", "manual");

        formData.append(
            "storySettings",
            JSON.stringify(selections)
        );

        formData.append(
            "characters",
            JSON.stringify(
                characters.map((character) => ({
                    id: character.id,
                    type: character.type,
                    name: character.name,
                    gender: character.gender || "",
                    age: character.age || "",
                    hobbies: character.hobbies || "",
                    favouriteFood: character.favouriteFood || "",
                    hasPhoto: Boolean(character.photo?.file)
                }))
            )
        );

        characters.forEach((character) => {
            if (character.photo?.file) {
                formData.append(
                    `characterPhoto-${character.id}`,
                    character.photo.file
                );
            }
        });

        console.log("FormData @j");

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            const response = await createBook(formData);

            console.log(response, "Response @j");
        } catch (error) {
            console.error("Failed to create story:", error);

            alert(
                "Something went wrong while creating your story. Please try again."
            );
        }
    };

    const handlePrimary = () => {
        handleCreateStory();
        setActiveStepId(ALL_STEPS[activeStepIndex + 1].id);
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            {/* Top Header */}
            <div className="flex shrink-0 items-center justify-between  px-7 pt-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={19} className="text-[#e6a51b]" fill="currentColor" />
                        <h1 className="text-[20px] font-bold text-[#37334c]">Let's build your story, step by step</h1>
                    </div>
                </div>
            </div>

            {/* Step Rail */}
            <StepRail
                steps={ALL_STEPS}
                activeStepId={activeStepId}
                onSelectStep={setActiveStepId}
                selections={selections}
                characters={characters}
                onClearStep={handleClearStep}
            />

            {/* Main Content */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
                <div className="min-h-0 flex-1 overflow-hidden">
                    {isCharacterStep ? (
                        <CharacterWorkspace
                            characters={characters}
                            setCharacters={setCharacters}
                            selections={selections}          // ← must be passed
                            onSelect={handleOptionSelect}    // ← must be passed
                            languageOptions={STORY_OPTIONS.language}
                            fontOptions={STORY_OPTIONS.font}
                        />
                    ) : (
                        <StepWorkspace step={activeStep} selections={selections} onSelect={handleOptionSelect} />
                    )}
                </div>

                {/* Footer action bar */}
                <div className="flex shrink-0 items-center justify-between border-t border-[#eeeaf2] pt-4">
                    <button
                        type="button"
                        disabled={isFirstStep}
                        onClick={() => setActiveStepId(ALL_STEPS[activeStepIndex - 1].id)}
                        className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#6947d7] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={handlePrimary}
                        disabled={!isLastStep && !isStepComplete(activeStep, selections, characters)}
                        className="rounded-full bg-linear-to-r from-[#8f6ff0] to-[#5f38d6] px-7 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(105,71,215,0.25)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isLastStep ? "Create My Story ✨" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
};