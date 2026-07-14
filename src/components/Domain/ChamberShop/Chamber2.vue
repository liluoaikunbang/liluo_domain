<template>

    <DomainLayout v-if="step.main.step == 'start'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start1'; init()">开始游戏</LiButton><br>
        </template>
        <template #right>
            <p>本剧本由童年阴影《小女孩家中的惨案》改编而成。</p>
            <p>主要改动：</p>
            <p>1.将原游戏惨死的爸爸妈妈换成了被绑架的大姐（25岁）和二姐（24岁）；</p>
            <p>2.将原游戏所有bad end换成了带有致命性紧缚的bad end；</p>
            <p>3.将原游戏中的罪犯老头改成了一个年轻女孩的形象；</p>
            <p>4.将原游戏最终向罪犯开枪的happy end换成了最终抓捕敌人的结局；</p>
            <p>5.加入隐藏的“警惕”机制，并根据该机制，修改了达到happy end的条件。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'start1'">
        <template #left>
            <LiButton class="default-button" @click="vigilant = -1; step.main.step = 'drawing_room'">“姐姐又忘记锁门了……”</LiButton><br>
            <LiButton class="default-button" @click="vigilant = 1; step.main.step = 'drawing_room'">“难道家里进小偷了？”</LiButton><br>
        </template>
        <template #right>
            <p>璃落放学后回到了家中，发现家里的大门竟然开着……</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'drawing_room'">
        <template #left>
            <LiButton class="default-button" v-show="vigilant > 0" @click="step.main.step = 'phone'">打电话报警</LiButton><br>
            <LiButton class="default-button" v-show="vigilant < 0" @click="step.main.step = 'sofa'">坐上沙发</LiButton><br>
            
            <!-- 这里如果已经有警惕心，打开收音机发现了状况后警惕情况会再次增加 -->
            <LiButton class="default-button" @click="if(vigilant > 0){ vigilant = 2 }; step.main.step = 'radio'">打开收音机</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'other_room'">走向其他房间</LiButton><br>
        </template>
        <template #right>
            <p>璃落来到了客厅。</p>
            <p v-show="vigilant > 0">想到回来时家门敞开着，璃落有些担心，应该先确定下家里有没有进小偷。但女孩子独自在家也要注意安全，应该怎么办呢？</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'sofa'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'sleepy'">有点困了</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'boring'">有点无聊</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'drawing_room'">站起来看看</LiButton><br>
        </template>
        <template #right>
            <p>璃落坐到了沙发上。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'sleepy'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end1'">继续</LiButton><br>
        </template>
        <template #right>
            <p>璃落躺在沙发上，很快睡着了。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'boring'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end1'">继续</LiButton><br>
        </template>
        <template #right>
            <p>璃落打开了电视，随后被身后靠近的陌生女人打晕。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'radio'">
        <template #left>
            <div v-show="vigilant > 0">
                <LiButton class="default-button" @click="step.main.step = 'other_room'">去其他房间</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'phone'">打电话报警</LiButton><br>
            </div>
            <div v-show="vigilant < 0">
                <LiButton class="default-button" @click="step.main.step = 'end1'">继续</LiButton><br>
            </div>
        </template>
        <template #right>
            <p>璃落打开了收音机。</p>
            <div v-show="vigilant > 0">
                <p>随后，听到脚步声的璃落躲到了窗帘后面。不久，声音远去，璃落走了出来。</p>
                <p>看来家里确实进了不速之客，必须想想办法。</p>
            </div>
            <div v-show="vigilant < 0">
                <p>随后被身后靠近的陌生女人打晕。</p>
            </div>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'phone'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end2'">继续</LiButton><br>
        </template>
        <template #right>
            <p>璃落按动拨号键，随后被闻声而来的陌生女人打晕。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'other_room'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'washroom'">向右走</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'corridor'">向左走</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'kitchen'">向前走</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'drawing_room'">回客厅</LiButton><br>
        </template>
        <template #right>
            <p>璃落来到走廊，右手边是卫生间，左手边是卧室和杂物间，前面是厨房。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'washroom'">
        <template #left>
            <LiButton class="default-button" v-show="!if_curtain" @click="if_curtain = true; step.main.step = 'curtain'">打开浴帘</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'other_room'">离开卫生间</LiButton><br>
        </template>
        <template #right>
            <p>璃落来到了卫生间。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'curtain'">
        <template #left>
            <div v-show="vigilant < 0">
                <LiButton class="default-button" @click="step.main.step = 'end3'">继续</LiButton><br>
            </div>
            <div v-show="vigilant > 0">
                <LiButton class="default-button" @click="step.main.step = 'other_room'">离开卫生间</LiButton><br>
            </div>
        </template>
        <template #right>
            <p>璃落拉开浴帘，映入眼帘的却是面前浴缸中全身赤裸的一个年轻女孩，她是璃落的二姐，现在正在读大学，正好最近放假回家。璃落看到姐姐被无数细铁链捆紧在浴缸中，双脚被锁链捆紧后锁在一个正在不断注水的水龙头上，浴缸中的水早已没过女孩的口鼻。</p>
            <div v-show="vigilant < 0">
                <p>毫无心理防备的璃落一下子叫出了声，随后被赶来的陌生女人打晕。</p>
            </div>
            <div v-show="vigilant > 0">
                <p>看到已经窒息昏迷的姐姐，璃落赶紧关掉水管，然后抱起姐姐的身体让她离开水面，放掉了浴缸中的水。探了一下鼻息，璃落发现姐姐还有微弱的呼吸，赶紧撕掉姐姐嘴上沾着的粉色粘性胶带，随后从姐姐的嘴里掏出了两双长筒袜。</p>
                <p>“塞得这么满，怪不得之前一点声音也听不到……”虽然自己的小嘴也经常受到同样的待遇，看到从姐姐不大的嘴里掏出两双吸满唾液充分胀大的长筒袜，璃落还是一阵惊讶——果然就像姐姐说的，姐姐的嘴巴虽然看起来都不大，但是潜力可是非常大的。</p>
                <p>像小仓鼠那样鼓鼓的两颊是璃雪最喜欢的萌点，所以姐姐在的时候也总是会用丝袜和胶带把璃落的小嘴这样封死起来，想到这里，璃落有些脸红，赶紧摇摇头将这种胡思乱想甩出脑海，继续给她解缚。</p>
                <p>璃落首先想要解开姐姐脚上的束缚，将她高高抬起的脚丫从水管上放下来，然而一把大大的挂锁马上便让璃落放弃了这个想法。</p>
                <p>璃落有一种不好的预感，她翻动姐姐的身体，拨开姐姐被后密密麻麻将她双手紧缚在身后的锁链，果然在几个锁链连接的关键位置都挂着小锁。</p>
                <p>“只能先委屈你一下了……”璃落叹了口气，这个姐姐全身缠满锁链，她根本无从下手，只好先让她接着在这里休息一下了，好在璃落及时感到，至少保住了二姐的性命。</p>
                <p>璃落正准备离开，余光突然瞥到了姐姐身下压着的一把钥匙，璃落拿起钥匙跟姐姐身上的十几把锁比对了一下，摇了摇头，收起钥匙站起身来。</p>
            </div>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'corridor'">
        <template #left>
            <div v-show="if_curtain">
                <LiButton class="default-button" @click="step.main.step = 'utility_room'">进入杂物间</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'bedroom'">进入卧室</LiButton><br>
                <LiButton class="default-button" @click="step.main.step = 'other_room'">回头</LiButton><br>
            </div>
            <div v-show="!if_curtain">
                <LiButton class="default-button" @click="step.main.step = 'other_room'">回头</LiButton><br>
            </div>
        </template>
        <template #right>
            <p>璃落面前是卧室和杂物间</p>
            <!-- 打开过浴帘，触发过剧情，也就肯定拿到了钥匙，因为没拿到的话会直接失败 -->
            <div v-show="if_curtain">
                <p>这两个房间都锁着，但在浴室中找到的钥匙应该可以打开房间门。</p>
            </div>
            <div v-show="!if_curtain">
                <p>房间的门锁了，璃落现在还没法进去。</p>
            </div>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'utility_room'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end3'">继续</LiButton><br>
        </template>
        <template #right>
            <p>璃落推开杂物间的门，随后被早已等候在此的陌生女人打晕。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'kitchen'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'microwave_oven'">打开微波炉热汉堡</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'paper'">阅读报纸</LiButton><br>
            <LiButton class="default-button" @click="step.main.step = 'other_room'">回头</LiButton><br>
        </template>
        <template #right>
            <p>璃落来到了厨房。微波炉旁放着一份报纸和一个已经凉掉的汉堡，此时璃落也有些饿了。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'microwave_oven'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end2'">继续</LiButton><br>
        </template>
        <template #right>
            <p>璃落打开了微波炉，随后被闻声而来的陌生女人打晕。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'paper'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'kitchen'">放下报纸</LiButton><br>
        </template>
        <template #right>
            <p>报纸上的新闻说本市有一名女性杀人犯最近刚刚越狱，请公民发现逃犯的踪迹后马上汇报。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'bedroom'">
        <template #left>
            <div v-show="vigilant > 1">
                <LiButton class="default-button" @click="step.main.step = 'happy_end'">继续</LiButton><br>
            </div>
            <div v-show="vigilant <= 1">
                <LiButton class="default-button" @click="step.main.step = 'end4'">继续</LiButton><br>
            </div>
        </template>
        <template #right>
            <div v-show="vigilant > 1">
                <p>璃落走进卧室，看到床边正躺着一个被麻绳五花大绑，不断挣扎的女孩，这是璃落那个已经工作的大姐。姐姐的嘴上也和浴室中的二姐一样沾着粘性胶带，无法发出声音，她一边“呜呜”地冲璃落叫着，一边用穿着肉色丝袜的脚丫从床底下踢出一个电棍。</p>
                <p>璃落心领神会，赶紧抓起电棍，正好此时外面传来一阵急促的脚步声，璃落赶紧转过身朝向门口，如临大敌。</p>
                <p>冲进门的是一个穿着黑色皮衣皮靴的年轻女孩。璃落定了定神，看着冲自己扑过来的女孩，瞅准机会将电棍戳了上去……</p>
            </div>
            <div v-show="vigilant <= 1">
                <p>璃落走进卧室，马上便看到了床边趴着的被麻绳四马攒蹄捆成一团的大姐，赶紧上去帮忙解缚。姐姐的双手背在身后，被紧紧的五花大绑起来，随后她穿着肉色丝袜的双脚也被麻绳交叉捆紧后跟手腕上的绳索连接起来，连接的绳索非常短，让姐姐只有肚子能够着地，膝盖和肩膀全部悬空，这样的极限驷马姿势彻底剥夺了姐姐移动的能力。</p>
                <p>璃落尝试解缚时才发现绳索捆得非常紧，而且都打了好几个死结，姐姐胳膊上被绳索缠绕过的地方已经开始发紫。绳结太紧了，仿佛这一次捆绑本就不打算再解开，璃落没有工具解不开绳索，只好说道：“大姐，绳子捆得太紧了，我解不开，我去找小刀帮你割开。”</p>
                <p>“呜呜呜！！”姐姐挣扎着摆脱了璃落，眼神盯着璃落身后，被胶带封死的小嘴不断地发出紧张的“呜呜”声。</p>
                <p>“怎么了？”璃落很快反应过来姐姐是让自己注意身后，她赶紧扭头看向门口，然而迎接她的却是一个陌生女人的手刀，璃落眼前一黑晕了过去……</p>
            </div>
        </template>
    </DomainLayout>




    <!-- 几个结局 -->
    <DomainLayout v-if="step.main.step == 'end1'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">重新开始</LiButton><br>
        </template>
        <template #right>
            <h3>坏结局1</h3>
            <p>璃落缓缓睁开眼睛，熟悉的场景让她知道自己正趴在客厅里的沙发上，然而映入眼帘的却是一阵刺眼的火光。</p>
            <p>“呜呜呜！！着火了？！”</p>
            <p>璃落一下子清醒过来，客厅中不知道什么时候被人堆放了大量可燃物，现在燃烧的火焰已经彻底包围了她。璃落挣扎着想要起身逃离，然而她的手脚却牢牢地背在身后紧缚在一起无法动弹。</p>
            <p>“呜呜~~”挣扎无用，璃落想要呼救，然而嘴里塞满了柔软的织物，外面也被胶带封死，璃落只能发出微弱的“呜呜”声，根本不可能将声音传到外面。</p>
            <p>手脚被缚，无法呼救，身边还有随时可能燃烧到自己身边的火舌，璃落不得不强迫自己平静下来，现在只能依靠自己了。</p>
            <p>璃落拼命挣扎起来，这才发现自己的双手已经被紧紧五花大绑在背后，粗糙的麻绳狠狠勒入璃落柔软的身体，让她的胳膊将绳子完全吃进肉中，双手丝毫动弹不得。而且璃落发现自己的双手已经开始失去知觉，看来她应该已经被绑在这里有一段时间了。</p>
            <p>双手被吊在后心处动弹不得，手指虽然没有被束缚，然而有限的活动空间内找不到任何一个绳结，而且璃落的手指也已经几乎失去知觉，完全使不上力气。</p>
            <p>上半身被五花大绑动弹不得，璃落不得不将注意力放在双腿，然而结果让她更加绝望——璃落那双穿着黑色中筒袜的双腿从大腿根部到脚掌被足足捆缚了8道绳索，紧密的捆缚将她肉肉的大腿绑成了一串糖葫芦，而小腿，脚踝，脚掌也无法逃脱麻绳的紧缚，就连袜子包裹的脚趾也被细绳强行将大脚趾捆了起来。璃落的双腿已经完全被捆成了一体，一点分开的机会都没有。</p>
            <p>这还不算完，为了防止璃落逃跑，那个人还将璃落脚踝和手腕上的绳索用一根短绳链接起来，将她捆成了极限驷马的姿势趴在沙发上，丝毫动弹不得。</p>
            <p>“呜呜！！”火势越来越近，浓烟已经让璃落无法呼吸，绝望的璃落只能选择了强制退出游戏。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'end2'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'end2continue'">继续</LiButton><br>
        </template>
        <template #right>
            <h3>坏结局2</h3>
            <p>“呜呜！！”璃落缓缓睁开眼睛，然而四周一片黑暗，嘴里塞着的大号口球让她的下巴非常疼，也第一时间吸引了璃落的注意力。</p>
            <p>璃落摇了摇头，然而口球两侧的皮带紧紧捆在璃落的后脑，让她只能咬着嘴里的口球说不出话来。璃落又想要用手拿出堵嘴，然而她的双手已经被五花大绑在背后，粗糙的麻绳狠狠勒入璃落柔软的身体，让她的胳膊将绳子完全吃进肉中，双手丝毫动弹不得。而且璃落发现自己的双手已经开始失去知觉，看来她应该已经被绑在这里有一段时间了。</p>
            <p>双手被吊在后心处动弹不得，手指虽然没有被束缚，然而有限的活动空间内找不到任何一个绳结，而且璃落的手指也已经几乎失去知觉，完全使不上力气。</p>
            <p>上半身被五花大绑动弹不得，璃落不得不将注意力放在双腿，然而结果让她更加绝望——璃落那双穿着黑色中筒袜的双腿从大腿根部到脚掌被足足捆缚了8道绳索，紧密的捆缚将她肉肉的大腿绑成了一串糖葫芦，而小腿，脚踝，脚掌也无法逃脱麻绳的紧缚，就连袜子包裹的脚趾也被细绳强行将大脚趾捆了起来。璃落的双腿已经完全被捆成了一体，一点分开的机会都没有。</p>
            <p>而且，璃落感觉自己的双腿不仅被绳索紧缚，小腿以下似乎被死死地嵌入什么东西中，丝毫动弹不得。</p>
            <p>“轰隆！”一声响雷的声音在璃落耳边炸起，伴随着突然的亮光，璃落终于看到了的状况——现在她被绑在了一个比她深得多的坑洞下，她的小腿以下不仅被绳捆索绑，还被已经凝固的水泥覆盖。</p>
            <p>“呜呜！！”仅仅是双腿的束缚就让璃落陷入了绝望，这可是凝固的水泥，就算她的手脚自由也根本不可能离开这个大坑，更不用说现在她的双手被五花大绑，双脚也已经被并拢捆成了美人鱼尾巴，而且嘴里堵着那么大的口球，连呼救别人帮忙都变得不可能。</p>
            <p>绝望的璃落发泄搬的拼命挣扎，然而不出所料，不管是身上打了无数死结，明显不打算再解开的绳索，还是脚下坚固的水泥束缚，都不是璃落这样一个普通的女孩可以撼动的。</p>
            <p>然而璃落的境遇还没有达到最坏，豆大的雨点落在璃落不断挣扎的身体上时，璃落稍微愣了愣，继而更加拼命地扭动起来——这场雨显然很大，璃落感觉覆盖到自己小腿的水泥平面上已经开始积水，而且水位在以肉眼可见的速度上涨，再这样下去她很快就会被淹没……</p>
            <p>虽然明知道自己已经不可能逃脱，跟放置在这里几天直到饿死相比，溺水恐怕已经是一种比较仁慈的方法了，然而求生的本能依然让女孩拼命挣扎，哪怕等待她的可能是更痛苦的折磨。</p>
            <p>半个小时后……</p>
            <p>璃落拼命仰着头，不知道是幸运还是不幸，水位刚刚好让璃落仰起头能勉强呼吸到空气，大雨已经停止，至少短时间内璃落已经没有了生命危险，虽然现在的状况依然绝望，她也不知道自己还能坚持多长时间，只能麻木的保持着这样一个别扭的姿势，奢望着奇迹的出现。</p>
            <p>一个小时后……</p>
            <p>似乎有脚步声传来，已经快要坚持不住的璃落终于看到了救命稻草，疯狂地叫喊着，希望那个人能来帮忙，果然，脚步声越来越近。璃落心里一下子有了希望，她靠在坑洞边缘，一边“呜呜”地向那个人求救，一边幻想着自己的新生活。</p>
            <p>“不知道两位姐姐怎么样了……”璃落的心里一阵紧张，她的境况已经无比绝望，两个姐姐肯定也差不多，但是根据自己这里的情况来看，那个人肯定要让她们受尽折磨，也就是说她们虽然你处在危险中，但很可能还活着。</p>
            <p>想到这里，璃落坚定了信念，自己出去后一定要赶紧报警，想办法救出两位姐姐。</p>
        </template>
    </DomainLayout>
    <DomainLayout v-if="step.main.step == 'end2continue'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">重新开始</LiButton><br>
        </template>
        <template #right>
            <p>“哗啦……”</p>
            <p>湿润的土壤从璃落头顶落下，让璃落一下子愣住了，似乎不敢相信。</p>
            <p>然而更多沙土裹挟着石块从上方落下，璃落如坠冰窖……</p>
            <p>饥饿，溺水，绝望，这些都一一坚持下来了，然而结局终究无法改变……</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'end3'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">重新开始</LiButton><br>
        </template>
        <template #right>
            <h3>坏结局3</h3>
            <p>璃落缓缓睁开眼睛，然而刺眼的阳光让她又赶紧闭上了眼睛。</p>
            <p>“呜呜！！”璃落的嘴里塞满了柔软的织物，外面也被胶带封死，她只能发出可爱的“呜呜”声，嘴里的异物一下子惊醒了璃落，她赶紧查看了一下自己的身体，果然已经被紧紧捆缚起来动弹不得。</p>
            <p>璃落拼命挣扎，然而她的双手已经被紧紧五花大绑在背后，拇指粗的锁链狠狠勒入璃落柔软的身体，让她的胳膊将锁链完全吃进肉中，双手丝毫动弹不得。而且璃落发现自己的双手已经开始失去知觉，看来她应该已经被绑在这里有一段时间了。</p>
            <p>双手被吊在后心处动弹不得，手指虽然没有被束缚，然而全身的锁链都被挂锁锁住，没有钥匙她根本没法解开，而且璃落的手指也已经几乎失去知觉，完全使不上力气。</p>
            <p>上半身被五花大绑动弹不得，璃落不得不将注意力放在双腿，然而结果让她更加绝望——璃落那双穿着黑色中筒袜的双腿从大腿根部到脚掌被足足捆缚了8道锁链，紧密的捆缚将她肉肉的大腿绑成了一串糖葫芦，而小腿，脚踝，脚掌也无法逃脱锁链的紧缚，就连袜子包裹的脚趾也被细绳强行将大脚趾捆了起来。璃落的双腿已经完全被捆成了一体，一点分开的机会都没有。</p>
            <p>而且璃落的脖子，胸部上下，腹部，大腿小腿脚踝等部位都用锁链和身后的一根铁柱捆绑在一起，让璃落只能背靠着身后的铁柱一点也动弹不了。</p>
            <p>此时璃落也终于适应了刺眼的阳光，睁开眼看着自己周围，她现在被捆在一个山泉中的铁柱上，清凉的泉水刚好没过璃落的膝盖，与之相对的，璃落赤裸的上半身则被炎炎烈日炙烤。</p>
            <p>“这是想把我做成烤肉干吗……”璃落拼命挣扎着，然而坚固的锁链根本不是她这样手无缚鸡之力的女孩可以撼动的。</p>
            <p>一天后……</p>
            <p>早已无力挣扎的璃落低着头，呆呆地望着脚下清澈的泉水，明明近在咫尺，身上坚固的束缚却让她完全没有办法喝到水。</p>
            <p>又半天后……</p>
            <p>“这就是那个人的目的吗？明明半身都浸泡在水中，却只能绝望地看着而喝不到，让我最终缺水而死？”璃落的思维已经几乎停滞，汗水已经流干，阳光的暴晒下璃落感觉自己正在逐渐失去意识。</p>
            <p>这样也好，总算可以解脱了。</p>
        </template>
    </DomainLayout>

    <DomainLayout v-if="step.main.step == 'end4'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">重新开始</LiButton><br>
        </template>
        <template #right>
            <h3>坏结局4</h3>
            <p>璃落被一阵窒息的感觉弄醒，她睁开眼睛，试图摆脱让自己呼吸困难的东西，然而璃落随即感觉到头皮一阵疼痛，原来有两根绳索将她的双马尾辫绑在了她现在坐着的椅背上，让璃落只能保持着抬头后仰的姿势，一点也移动不了。</p>
            <p>“呜呜！”又一滴水滴下来，正好滴在璃落被袜子堵死，还戴着几层口罩的嘴上，现在显然已经过了很久，口罩已经全部湿透了，让璃落感到一阵阵窒息。</p>
            <p>璃落看着上方那个正在不断滴水的水管，虽然现在还能勉强呼吸，但是窒息的感觉显然不好受，璃落拼命挣扎着想要让自己离开那个水管，然而只是徒劳。</p>
            <p>璃落的双手已经被紧紧五花大绑在背后，拇指粗的麻绳狠狠勒入璃落柔软的身体，让她的胳膊将绳子完全吃进肉中，双手丝毫动弹不得。而且璃落发现自己的双手已经开始失去知觉，看来她应该已经被绑在这里有一段时间了。</p>
            <p>双手被吊在后心处动弹不得，手指虽然没有被束缚，然而全身的麻绳都在她手指无法够到的地方打着死结，而且璃落的手指也已经几乎失去知觉，完全使不上力气。</p>
            <p>上半身被五花大绑动弹不得，璃落不得不将注意力放在双腿，然而结果让她更加绝望——璃落那双穿着黑色中筒袜的双腿从大腿根部到脚掌被足足捆缚了8道锁链，紧密的捆缚将她肉肉的大腿绑成了一串糖葫芦，而小腿，脚踝，脚掌也无法逃脱麻绳的紧缚，就连袜子包裹的脚趾也被细绳强行将大脚趾捆了起来。璃落的双腿已经完全被捆成了一体，一点分开的机会都没有。</p>
            <p>而且璃落的脖子，胸部上下，腹部等部位都用麻绳和身后的椅子捆绑在一起，让璃落只能背靠着身后的椅子一点也动弹不了，被绳索并拢捆绑的脚踝也跟一面的椅子腿捆绑在一起，将璃落所有的自由全部剥夺。</p>
            <p>一天后……</p>
            <p>“呜呜！！”水滴不断滴下，时刻带给璃落窒息的痛苦，却又不让她失去意识，身上绝望的束缚又让璃落只能保持在这种痛苦的折磨下无法解脱。</p>
            <p>又过了一天后……</p>
            <p>实在忍受不了的璃落只能选择了强制退出游戏，当她大口呼吸着新鲜空气摘下头盔时，游戏界面显示出了女孩最后的结局……</p>
            <p>直到三周后警察才在家中发现了女孩的尸体，经过检查发现女孩最后是因为没有食物而被饿死的，在这之前，她至少在窒息和饥饿的折磨中度过了一周……</p>
            <p>想到自己刚刚经过两天就无法忍受，璃落不禁打了个寒颤……</p>
        </template>
    </DomainLayout>
    
    <DomainLayout v-if="step.main.step == 'happy_end'">
        <template #left>
            <LiButton class="default-button" @click="step.main.step = 'start'">重新开始</LiButton><br>
        </template>
        <template #right>
            <h3>完美结局</h3>
            <p>“大姐二姐，这家伙怎么处置呀？”璃落看着面前被自己电得不省人事的女孩，抬起头问道，此时她的两位姐姐已经都恢复了自由。</p>
            <p>“既然她是个通缉犯，那就把她捆紧了交给警察吧。”</p>
            <p>“她可是差点杀了我！怎么能就这么放过她呢！”二姐不满地说道。</p>
            <p>“那就把她交给你了。”大姐笑着说道，“我明天报警，今晚怎么玩随你，不过别让她发出太大声音。”</p>
            <p>“嘿嘿~~姐姐最好了！”</p>
            <p>因为后面的画面少儿不宜，璃落被大姐领着走出了房间，没有看到那个可恶的家伙会受到什么惩罚。</p>
            <p>第二天警察过来时，璃落看到二姐牵着那个浑身赤裸的年轻女孩从房间里走了出来，路过璃落身边时，女孩身上嗡嗡的响声一下子让璃落羞红了脸，不过她还是抑制不住心中的好奇，一直盯着面前被紧缚的女孩。</p>
            <p>只见面前的女孩穿着铁质的贞操带和铁质胸罩，从里面延伸出来的电线可以看出她的双乳和下体里面肯定都塞满了震动玩具，除此之外，女孩的手肘在背后被一个手铐锁在一起，双手又在身前被一个中间没有链条的土铐铐紧，几乎让她的上半身完全无法动弹。</p>
            <p>再向下看，璃落发现女孩大腿根部的贞操带连接着并拢锁死的大腿环，膝盖上方也有着一个距离不到5厘米的膝铐，脚踝上同样锁着一个距离大概20厘米的脚铐，让这个女孩的步伐只能限制在一个脚掌左右。</p>
            <p>二姐正在跟警察说明女孩身上的束缚，而这个女孩也只是安静地低着头呆在旁边，不敢挣扎也不敢出声，看来昨天晚上被调教地很惨……</p>
            <p>“这些是她贞操带和手铐脚镣的钥匙，鉴于她有过越狱的前科，我建议这些束具就跟着她到服刑结束比较好。”二姐坏笑着介绍起来，“这个遥控器可以控制她上下三个震动玩具的强度，还附带了高潮封闭模式，如果她不听话可以用这种模式惩罚哦……”</p>
            <p>看着旁边一动不敢动的女孩，虽然她的所作所为不值得同情，璃落还是默默在心中替她点了根蜡……</p>
            <p>不过，看二姐对这些束具如数家珍的样子，肯定是对拘束和调教很在行，如果有机会的话……璃落赶紧低下头捂住脸颊，不让回头的二姐看到她羞红的脸颊……</p>
        </template>
    </DomainLayout>

</template>

<script setup>
    import { useUsersStore } from '@/store/store'

    const store = useUsersStore()
    const step = ref(store.game_step.domain.chamber_shop.chamber2)
    const data = reactive({
        vigilant: -1, // 用于判定主角的警惕性。有-1,1，2三个档次，只有警觉性到2时才能触发好结局
        if_curtain: false, // 是否已经在卫生间拉开过浴帘，如果拉开过则不能重复拉开，且没法拿到钥匙
    })
    const { vigilant, if_curtain } = toRefs(data)
    const init = () => {
        data.vigilant = -1
        data.if_curtain = false
    }

</script>


<style scoped>
</style>


